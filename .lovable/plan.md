
# Root Cause Analysis & Fix Plan: Profile, Messages, and Notifications Pages Not Loading

## Executive Summary

After extensive investigation, I identified the **critical root cause**: the database trigger that creates user profiles on signup is **not installed**. This means when users sign up via email OTP or Google OAuth, their auth record is created in `auth.users` but no corresponding profile is created in `public.profiles`. Without a profile, all protected pages fail to load properly.

---

## Root Cause Analysis

### Issue 1: Missing Database Trigger (CRITICAL)

**Finding:** The function `handle_new_user()` exists in the database, but there is NO trigger attached to `auth.users` to execute it when new users sign up.

**Evidence:**
- Query of `auth.users` shows 1 user exists (email: prodmandeep@gmail.com)
- Query of `profiles` table returns 0 rows
- No trigger with "new_user" or "handle" in the name is attached to auth.users

**Impact:** Every user who signs up gets stuck because:
1. Auth succeeds (user created in auth.users)
2. Profile query fails (no row in profiles table)
3. Pages show loading/error states indefinitely

### Issue 2: ProtectedRoute Redirect Path

**Finding:** The `ProtectedRoute` component redirects to `/auth/login` (line 49) which then redirects to `/auth`. This creates an unnecessary redirect chain.

**File:** `src/components/ProtectedRoute.tsx` line 49

### Issue 3: No Fallback Profile Creation

**Finding:** The `AuthContext` fetches the profile but has no fallback if the profile doesn't exist. It should create a profile row if one doesn't exist for an authenticated user.

---

## Fix Plan

### Database Migration Required

```sql
-- 1. Create trigger to handle new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Create profile for existing orphaned user
INSERT INTO public.profiles (id, username, full_name, email)
SELECT 
  id,
  split_part(email, '@', 1) as username,
  NULL as full_name,
  email
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- 3. Create user_roles for existing orphaned user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'learner'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles);

-- 4. Create referrals for existing orphaned user
INSERT INTO public.referrals (referrer_id, referral_code)
SELECT id, UPPER(ENCODE(GEN_RANDOM_BYTES(6), 'hex'))
FROM auth.users
WHERE id NOT IN (SELECT referrer_id FROM public.referrals);
```

### Frontend Fixes

#### Fix 1: Update ProtectedRoute redirect path
**File:** `src/components/ProtectedRoute.tsx`

Change line 49 from:
```tsx
return <Navigate to="/auth/login" state={{ from: location }} replace />;
```
To:
```tsx
return <Navigate to="/auth" state={{ from: location }} replace />;
```

#### Fix 2: Add fallback profile creation in AuthContext
**File:** `src/contexts/AuthContext.tsx`

Update the `fetchProfile` function to create a profile if one doesn't exist:

```typescript
const fetchProfile = useCallback(async (userId: string, userEmail?: string) => {
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist - create it
      const username = userEmail ? userEmail.split('@')[0] : `user_${userId.slice(0, 8)}`;
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username,
          email: userEmail,
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error creating profile:', insertError);
        return null;
      }
      return newProfile as Profile;
    }

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data as Profile;
  } catch (err) {
    console.error('Error fetching profile:', err);
    return null;
  }
}, []);
```

Update the calls to `fetchProfile` to pass the user's email:
```typescript
const profileData = await fetchProfile(initialSession.user.id, initialSession.user.email);
```

#### Fix 3: Update Inbox page to handle edge cases better
**File:** `src/pages/Inbox.tsx`

The page currently shows a loading skeleton when `isLoading` is true. Add a timeout fallback to prevent infinite loading.

#### Fix 4: Update Notifications page similarly
**File:** `src/pages/Notifications.tsx`

Ensure proper handling when notifications query returns empty but user is authenticated.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/ProtectedRoute.tsx` | Fix redirect path from `/auth/login` to `/auth` |
| `src/contexts/AuthContext.tsx` | Add fallback profile creation when profile doesn't exist |
| `src/pages/Profile.tsx` | Add better error handling for missing profiles |
| `src/pages/Inbox.tsx` | Already good - just verify auth flow |
| `src/pages/Notifications.tsx` | Already good - just verify auth flow |

## Database Migration

Create a new migration that:
1. Installs the trigger on `auth.users` to call `handle_new_user()`
2. Creates profiles for any existing orphaned users
3. Creates user_roles and referrals for orphaned users

---

## Verification Steps

After implementation:
1. Sign out completely
2. Sign up with a new email via OTP
3. Verify profile is created automatically
4. Navigate to Profile page - should load
5. Navigate to Messages page - should show empty state
6. Navigate to Notifications page - should show empty state
7. Verify existing user (prodmandeep@gmail.com) can log in and see their profile

---

## Technical Notes

- The `handle_new_user()` function already exists and is correct
- The `compute_profile_completeness` trigger fires on INSERT/UPDATE to profiles - will work once profiles are created
- The `compute_user_tier` trigger is also ready
- All RLS policies are correctly configured - the issue was purely the missing trigger

## Risk Assessment

**Low Risk:** 
- Adding a trigger to auth.users is standard practice
- Creating profiles for orphaned users is idempotent (uses NOT IN subquery)
- Frontend fallback is defensive and won't break existing flows
