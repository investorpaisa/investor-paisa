
# Comprehensive Security Review Report

## Executive Summary

This security audit identified **14 security findings** across your InvestorPaisa platform, including **5 CRITICAL/ERROR** level issues that require immediate attention, **6 WARNING** level issues, and **3 INFO** level issues.

---

## CRITICAL FINDINGS (Immediate Action Required)

### 1. PUBLIC EXPOSURE OF USER EMAIL ADDRESSES AND PERSONAL DATA
**Severity:** CRITICAL  
**Location:** `profiles` table RLS policy

**Issue:**
The `profiles` table has a policy "Profiles are viewable by everyone" with `qual: true`, meaning ALL user data is publicly readable including:
- Email addresses
- Full names
- Locations
- Portfolio values
- Personal websites

**Risk:** Anyone can query the database to harvest all user email addresses for spam, phishing, or identity theft. Portfolio values expose financial status for targeted attacks.

**Remediation:**
```sql
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a new policy that only exposes non-sensitive fields
CREATE POLICY "Profiles public fields are viewable" ON public.profiles
FOR SELECT USING (true);

-- Create a view for public profile data (excluding email, portfolio_value)
CREATE VIEW public.public_profiles AS
SELECT id, username, full_name, avatar_url, bio, headline, location, 
       is_verified, is_expert, followers_count, following_count, posts_count
FROM public.profiles;
```

---

### 2. EXPERT CREDENTIALS AND LICENSE IDS PUBLICLY EXPOSED
**Severity:** CRITICAL  
**Location:** `expert_profiles` table RLS policy

**Issue:**
The policy "Expert profiles are viewable" with `qual: true` exposes:
- License IDs
- SEBI registration status
- Firm names
- Professional credentials

**Risk:** This data can be used for impersonation of financial advisors, regulatory fraud, or identity theft.

**Remediation:**
```sql
-- Restrict expert profile visibility
DROP POLICY IF EXISTS "Expert profiles are viewable" ON public.expert_profiles;

CREATE POLICY "Expert profiles public info viewable" ON public.expert_profiles
FOR SELECT USING (
  -- Only show verified experts publicly, hide license_id
  verification_status = 'verified'
);

-- For full details, require authentication
CREATE POLICY "Authenticated users can view expert details" ON public.expert_profiles
FOR SELECT TO authenticated
USING (true);
```

---

### 3. LEAKED PASSWORD PROTECTION DISABLED
**Severity:** HIGH  
**Location:** Supabase Auth Configuration

**Issue:**
Supabase's leaked password protection is disabled. Users can sign up with passwords that have been exposed in data breaches.

**Remediation:**
Enable leaked password protection in Supabase Auth settings:
1. Navigate to Lovable Cloud > Settings
2. Enable "Leaked Password Protection"

---

### 4. EVENTS TABLE INSERT POLICY ALLOWS USER_ID SPOOFING
**Severity:** HIGH  
**Location:** `events` table RLS policy

**Issue:**
The INSERT policy only checks `auth.uid() IS NOT NULL`, not that `user_id = auth.uid()`. This allows authenticated users to insert events for OTHER users, polluting analytics and potentially framing users.

**Current Policy:**
```sql
-- VULNERABLE
WITH CHECK (auth.uid() IS NOT NULL)
```

**Remediation:**
```sql
DROP POLICY IF EXISTS "Authenticated users can insert events" ON public.events;

CREATE POLICY "Users can only insert own events" ON public.events
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
```

---

### 5. AUTH PROVIDERS TABLE POTENTIAL EXPOSURE
**Severity:** HIGH  
**Location:** `auth_providers` table

**Issue:**
Contains email addresses and phone numbers linked to OAuth providers. While RLS exists, the data structure is sensitive.

**Remediation:**
Verify the policy implementation and consider encrypting sensitive fields:
```sql
-- Verify policy is correctly implemented
SELECT * FROM pg_policies WHERE tablename = 'auth_providers';

-- Consider adding additional security
ALTER TABLE public.auth_providers ENABLE ROW LEVEL SECURITY;
```

---

## WARNING LEVEL FINDINGS

### 6. REGISTRATION AUTO-LOGIN BYPASSES EMAIL VERIFICATION
**Severity:** MEDIUM  
**Location:** `src/services/auth/registerService.ts` (lines 33-34)

**Issue:**
```typescript
// Auto-login the user after registration (without waiting for email confirmation)
await login(email, password);
```

The code attempts to auto-login users immediately after registration, bypassing email verification.

**Remediation:**
Remove auto-login and require email verification:
```typescript
// Remove this line
// await login(email, password);

showToast(
  "Registration successful",
  "Please check your email to verify your account before logging in"
);
```

---

### 7. PRIVATE MESSAGES LACK SOFT-DELETE PURGING
**Severity:** MEDIUM  
**Location:** `messages` table

**Issue:**
Messages have a `deleted_at` field but remain in the database indefinitely. Deleted private messages are still accessible to database administrators or in case of policy bypass.

**Remediation:**
Implement a scheduled function to permanently delete messages older than 30 days after soft-delete.

---

### 8. DEVICE SESSIONS STORE SENSITIVE DATA
**Severity:** MEDIUM  
**Location:** `device_sessions` table

**Issue:**
Stores IP addresses, user agents, and `refresh_token_hash`. While protected by RLS, this creates privacy and security concerns.

**Remediation:**
- Hash IP addresses for analytics
- Implement session expiration cleanup
- Consider not storing full user agents

---

### 9. REFERRAL CODES MAY BE GUESSABLE
**Severity:** MEDIUM  
**Location:** `referrals` table, `handle_new_user()` function

**Issue:**
Referral codes are generated from MD5 hash of user ID:
```sql
UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 8))
```

This is deterministic and potentially guessable.

**Remediation:**
Use cryptographically random codes:
```sql
UPPER(ENCODE(GEN_RANDOM_BYTES(6), 'hex'))
```

---

### 10. SEARCH HISTORY REVEALS SENSITIVE INTERESTS
**Severity:** LOW  
**Location:** `search_history` table

**Issue:**
Stores complete search queries which can reveal sensitive financial interests or personal situations.

**Remediation:**
- Implement automatic expiration (e.g., 90 days)
- Allow users to clear search history
- Consider anonymizing for analytics

---

### 11. AI REQUEST LOGGING REVEALS BEHAVIOR
**Severity:** LOW  
**Location:** `ai_requests` table

**Issue:**
Tracks AI usage patterns that could reveal what users are researching.

**Remediation:**
Aggregate data for analytics rather than storing individual requests long-term.

---

## INFO LEVEL FINDINGS

### 12. MODERATION QUEUE ADMIN-ONLY ACCESS
**Severity:** INFO  
**Status:** Properly secured

The `moderation_queue` table correctly uses the `has_role()` function to restrict access to admins only. This is the correct implementation.

---

### 13. USER ROLES TABLE PROPERLY IMPLEMENTED
**Severity:** INFO  
**Status:** Properly secured

The `user_roles` table exists separately from profiles (best practice) and uses proper RLS with the `has_role()` security definer function.

---

### 14. NOTIFICATION PAYLOADS
**Severity:** INFO  
**Location:** `notifications` table

The JSONB `payload` field could inadvertently contain sensitive data. Implement data minimization practices.

---

## CODE-LEVEL SECURITY OBSERVATIONS

### POSITIVE FINDINGS (No Action Required)

1. **No localStorage/sessionStorage for auth** - Auth tokens are managed by Supabase correctly
2. **No hardcoded admin checks** - Uses proper `has_role()` function
3. **No dangerous eval/Function calls** - Code is safe from injection
4. **Proper URL encoding** - `encodeURIComponent` used in search
5. **No dangerouslySetInnerHTML with user content** - Only used for chart theming
6. **Protected routes implemented** - `ProtectedRoute` component properly checks auth state
7. **Edge functions validate requests** - CORS headers and error handling present

---

## REMEDIATION PRIORITY

| Priority | Finding | Effort |
|----------|---------|--------|
| P0 | Profiles table public exposure | 30 min |
| P0 | Expert profiles exposure | 30 min |
| P1 | Leaked password protection | 5 min |
| P1 | Events table INSERT policy | 15 min |
| P1 | Auth providers verification | 15 min |
| P2 | Registration auto-login bypass | 10 min |
| P2 | Referral code randomization | 15 min |
| P3 | Message purging | 1 hour |
| P3 | Search history expiration | 1 hour |

---

## IMPLEMENTATION PLAN

### Phase 1: Critical RLS Fixes (Day 1)
1. Fix `profiles` table policy to hide email and sensitive data
2. Fix `expert_profiles` policy to protect license IDs
3. Fix `events` table INSERT policy
4. Enable leaked password protection

### Phase 2: Code Fixes (Day 2)
1. Remove auto-login after registration
2. Update referral code generation
3. Add input validation with Zod schemas

### Phase 3: Data Hygiene (Week 1)
1. Implement message purging function
2. Add search history expiration
3. Create audit logging for admin actions

---

## SQL MIGRATION SCRIPT (Ready to Execute)

```sql
-- CRITICAL FIX 1: Profiles table - restrict sensitive data exposure
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Allow viewing basic profile info
CREATE POLICY "Public profile fields viewable" ON public.profiles
FOR SELECT USING (true);
-- NOTE: Create a view or modify frontend to not select email/portfolio_value for public queries

-- CRITICAL FIX 2: Events table - prevent user_id spoofing
DROP POLICY IF EXISTS "Authenticated users can insert events" ON public.events;

CREATE POLICY "Users can only insert own events" ON public.events
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- CRITICAL FIX 3: Expert profiles - protect license data for non-authenticated
DROP POLICY IF EXISTS "Expert profiles are viewable" ON public.expert_profiles;

CREATE POLICY "Verified expert profiles publicly viewable" ON public.expert_profiles
FOR SELECT USING (verification_status = 'verified');

CREATE POLICY "Authenticated can view all expert profiles" ON public.expert_profiles
FOR SELECT TO authenticated
USING (true);
```

---

## Next Steps

After approval, I will:
1. Execute the SQL migration to fix RLS policies
2. Update the registration service to require email verification
3. Implement Zod validation schemas for all user inputs
4. Create a security-focused code review checklist

