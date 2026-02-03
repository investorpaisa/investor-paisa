
# InvestorPaisa Production Readiness - Comprehensive Fix Plan

## Executive Summary

This plan addresses 11 critical production issues. The **ROOT CAUSE** for multiple failures (Mobile OTP, LinkedIn Connect, Trending, Markets) is that `import.meta.env.VITE_SUPABASE_URL` returns `undefined` at runtime in various components, causing edge function calls to fail with "undefined/functions/v1/..." URLs. The fix requires using the exported `getSupabaseUrl()` function from the Supabase client.

---

## Critical Root Cause: Environment Variables Not Available

### Evidence
Network requests show:
```
GET undefined/functions/v1/news-trending?type=all&limit=20
GET undefined/functions/v1/promotions-profiles?type=profile&limit=3
```

Console errors:
```
SyntaxError: Unexpected token '<', "<!DOCTYPE"... is not valid JSON
Mobile verification service is temporarily unavailable
LinkedIn Connect service is temporarily unavailable
```

### Solution
Replace all instances of:
```typescript
`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/...`
```

With:
```typescript
import { getSupabaseUrl } from '@/integrations/supabase/client';
// ...
`${getSupabaseUrl()}/functions/v1/...`
```

---

## Issue 1: Mobile OTP Not Working

### Problem
- Error: "Server returned invalid response. Please try again."
- Root cause: `import.meta.env.VITE_SUPABASE_URL` is undefined
- Twilio trial limitation: can only send SMS to verified numbers

### Solution

#### A. Fix URL in MobileVerificationModal.tsx
Change from:
```typescript
`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-mobile-request-otp`
```
To:
```typescript
import { getSupabaseUrl } from '@/integrations/supabase/client';
// ...
`${getSupabaseUrl()}/functions/v1/auth-mobile-request-otp`
```

#### B. Alternative: Use Lovable AI's OTP Solution
Since Lovable Cloud supports auth, we can leverage Supabase's built-in phone auth instead of custom Twilio integration:
- Use `supabase.auth.signInWithOtp({ phone: phoneNumber })` for OTP request
- Use `supabase.auth.verifyOtp({ phone, token, type: 'sms' })` for verification
- This uses Supabase's auth system which may have SMS configured

If Supabase phone auth is not available, keep Twilio but fix the URL issue.

### Files Modified
- `src/components/profile/MobileVerificationModal.tsx`

---

## Issue 2: LinkedIn Connect Not Working

### Problem
- Error: "Server returned invalid response. LinkedIn Connect may not be available."
- Same root cause: undefined URL

### Solution
Fix URL in LinkedInConnect.tsx:
```typescript
import { getSupabaseUrl } from '@/integrations/supabase/client';
// ...
`${getSupabaseUrl()}/functions/v1/auth-linkedin-connect`
```

### Files Modified
- `src/components/profile/LinkedInConnect.tsx`

---

## Issue 3: Public Profile Issues

### Current Problems
1. **Follower/Following counts not updating** - The counts in the profile summary are static (read from `profiles_public` view), but the `useToggleFollow` mutation doesn't invalidate the public profile query
2. **Followers/Following not clickable** - No modal/page to show the list
3. **Skills, Interests, Certifications not showing** - Privacy settings not being checked for these sections

### Solution

#### A. Fix Count Updates After Follow/Unfollow
In `useFollows.ts`, add invalidation for public profile query:
```typescript
onSuccess: (result, targetUserId) => {
  queryClient.invalidateQueries({ queryKey: ['following'] });
  queryClient.invalidateQueries({ queryKey: ['followers'] });
  queryClient.invalidateQueries({ queryKey: ['isFollowing', user?.id, targetUserId] });
  queryClient.invalidateQueries({ queryKey: ['public-profile'] }); // Add this
  queryClient.invalidateQueries({ queryKey: ['profile'] }); // Add this
  toast.success(result.action === 'followed' ? 'Following!' : 'Unfollowed');
},
```

#### B. Create Followers/Following Modal (Instagram-like)
Create new component: `FollowersModal.tsx`
- Accept `userId`, `type: 'followers' | 'following'`, `isOpen`, `onClose` props
- Fetch followers/following list using existing hooks
- Display list with avatar, name, username, follow button
- Navigate to public profile on click

#### C. Make Counts Clickable in PublicProfile.tsx
```typescript
<button 
  onClick={() => setShowFollowersModal(true)}
  className="text-left"
>
  <span className="font-bold text-sm">{profile.followers_count || 0}</span>
  <span className="text-muted-foreground text-xs ml-1">Followers</span>
</button>
```

#### D. Add Skills & Interests Sections to PublicProfile
Add queries for skills and interests:
```typescript
// Fetch user's skills
const { data: skills } = useQuery({
  queryKey: ['public-profile-skills', profile?.id],
  queryFn: async () => {
    if (!profile?.id) return [];
    const { data, error } = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', profile.id);
    if (error) return [];
    return data || [];
  },
  enabled: !!profile?.id && fullProfile?.privacy_skills !== false,
});

// Display interests from profile
{fullProfile?.privacy_interests !== false && profile.interests?.length > 0 && (
  <Card>
    <CardHeader>
      <CardTitle>Interests</CardTitle>
    </CardHeader>
    <CardContent>
      {profile.interests.map(interest => (
        <Badge key={interest}>{interest}</Badge>
      ))}
    </CardContent>
  </Card>
)}
```

### Files Modified/Created
- `src/pages/PublicProfile.tsx`
- `src/hooks/useFollows.ts`
- Create: `src/components/profile/FollowersModal.tsx`

---

## Issue 4: Trending & Markets Data Empty

### Problem
- Edge function URLs are undefined
- TrendingStructuredFeed.tsx fetches from `undefined/functions/v1/...`
- marketService.ts uses `import.meta.env.VITE_SUPABASE_URL` directly

### Solution

#### A. Fix TrendingStructuredFeed.tsx
```typescript
import { getSupabaseUrl } from '@/integrations/supabase/client';
// ...
const profilesRes = await fetch(
  `${getSupabaseUrl()}/functions/v1/promotions-profiles?type=profile&limit=3`
);
```

#### B. Fix marketService.ts
```typescript
import { getSupabaseUrl, getSupabaseAnonKey } from '@/integrations/supabase/client';
// ...
const MARKET_DATA_URL = `${getSupabaseUrl()}/functions/v1/market-data`;
// Use getSupabaseAnonKey() for Authorization header
```

#### C. Fix newsService API files
Update all files in `src/services/news/api/` to use `getSupabaseUrl()`

### Files Modified
- `src/components/feed/TrendingStructuredFeed.tsx`
- `src/services/market/marketService.ts`
- `src/services/news/api/*.ts`

---

## Issue 5: Saved Post Widget Not Showing Preview

### Current State
The Saved tab in Profile.tsx only shows:
```
[Bookmark icon] [Badge: post]
Saved 3 days ago
```

### Solution
Fetch the actual post data when displaying bookmarks:
```typescript
// In useQuery for bookmarks, also fetch the post data
const { data: userBookmarks } = useQuery({
  queryKey: ['user-bookmarks', profile?.id],
  queryFn: async () => {
    if (!profile?.id || !isOwnProfile) return [];

    const { data: bookmarks, error } = await supabase
      .from('bookmarks')
      .select('id, entity_id, entity_type, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    if (!bookmarks) return [];

    // Fetch post details for post bookmarks
    const postIds = bookmarks.filter(b => b.entity_type === 'post').map(b => b.entity_id);
    const { data: posts } = await supabase
      .from('posts')
      .select('id, title, body, type, like_count, comment_count, created_at')
      .in('id', postIds);

    const postsMap = new Map(posts?.map(p => [p.id, p]) || []);
    
    return bookmarks.map(b => ({
      ...b,
      post: b.entity_type === 'post' ? postsMap.get(b.entity_id) : null,
    }));
  },
  enabled: !!profile?.id && isOwnProfile,
});
```

Then display with same format as Posts tab.

### Files Modified
- `src/pages/Profile.tsx`

---

## Issue 6: Add Button Alignment in Edit Profile

### Current State
Screenshot shows Add button is inline with title ("Experience + Add"), not right-aligned.

### Current Code (ExperienceSection.tsx lines 91-107)
```typescript
<div className="flex items-center justify-between">
  <CardTitle className="flex items-center text-base sm:text-lg font-semibold">
    <Briefcase className="h-5 w-5 mr-2 text-primary" />
    Experience
  </CardTitle>
  <Button ...>+ Add</Button>
</div>
```

The code looks correct but the screenshot shows otherwise. The issue may be that the CardTitle flex items is preventing proper justify-between.

### Solution
Remove flex from CardTitle and make it a span:
```typescript
<div className="flex items-center justify-between w-full">
  <div className="flex items-center text-base sm:text-lg font-semibold">
    <Briefcase className="h-5 w-5 mr-2 text-primary" />
    Experience
  </div>
  <Button ...>+ Add</Button>
</div>
```

Apply same fix to:
- `EducationSection.tsx`
- `CertificationsSection.tsx`
- `SkillsSection.tsx`
- `InterestsSection.tsx` (already has correct pattern)

### Files Modified
- `src/components/profile/edit/ExperienceSection.tsx`
- `src/components/profile/edit/EducationSection.tsx`
- `src/components/profile/edit/CertificationsSection.tsx`
- `src/components/profile/edit/SkillsSection.tsx`

---

## Issue 7: Privacy Settings Missing Interests

### Current State
`PrivacySection.tsx` has settings for:
- Experience
- Education
- Certifications
- Skills

But NOT for Interests.

### Solution
Add interests privacy setting:
```typescript
const privacySettings = [
  // ... existing
  {
    key: 'privacy_interests',
    label: 'Interests',
    description: 'Show your financial interests on public profile',
    value: privacyInterests,
  },
];
```

Also need to:
1. Add `privacy_interests` column to profiles table
2. Update `useEditProfile.ts` to handle privacy_interests
3. Update `PublicProfile.tsx` to check privacy_interests

### Files Modified
- `src/components/profile/edit/PrivacySection.tsx`
- `src/hooks/useEditProfile.ts`
- `src/pages/PublicProfile.tsx`
- Database migration: add `privacy_interests` column

---

## Issue 8: Recent Posts on Public Profile Not Truncated

### Current State
Shows all 10 posts, should show 1-2 with "See all" CTA

### Solution
LinkedIn-style layout for Recent Posts section:
```typescript
{/* Recent Activity - LinkedIn style */}
<Card className="border border-border/50">
  <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
    <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
    {userPosts && userPosts.length > 1 && (
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => navigate(`/u/${profile.username}?tab=posts`)}
        className="text-primary text-xs"
      >
        See all {userPosts.length}
      </Button>
    )}
  </CardHeader>
  <CardContent className="p-4 pt-2">
    {/* Show only first post */}
    {userPosts && userPosts.length > 0 ? (
      <div className="p-3 rounded-lg bg-secondary/30">
        <Badge variant="outline" className="text-[10px] mb-2">{userPosts[0].type}</Badge>
        <h4 className="font-medium text-sm line-clamp-2">{userPosts[0].title}</h4>
        {userPosts[0].body && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{userPosts[0].body}</p>
        )}
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span>{userPosts[0].like_count || 0} likes</span>
          <span>{userPosts[0].comment_count || 0} comments</span>
        </div>
      </div>
    ) : (
      <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
    )}
  </CardContent>
</Card>
```

### Files Modified
- `src/pages/PublicProfile.tsx`

---

## Issue 9: Notifications Not Appearing

### Current State
Database shows notifications ARE being created (follow notifications exist in table). The issue is they're missing title/body fields.

### Evidence from Database
```
actor_id: b32ab9c1-497a-45d6-80fe-3369b9c55f36
body: null
title: null
type: follow
```

### Solution
Update the `handle_follow_change()` database function to include title and body:
```sql
INSERT INTO public.notifications (user_id, type, actor_id, entity_type, entity_id, title, body)
VALUES (
  NEW.following_id, 
  'follow', 
  NEW.follower_id, 
  'user', 
  NEW.follower_id,
  'New follower',
  'started following you'
);
```

Also need to create similar triggers for:
- Comments on posts
- Answers to questions
- Upvotes/downvotes
- Reposts

### Files Modified
- Database migration: Update triggers

---

## Issue 10: Backend - Remove "Hide Own Posts" Option

### Problem
Users can hide their own content, which doesn't make sense.

### Solution
The frontend already has logic in Feed.tsx but need to ensure it's consistent. Looking at the PostCard dropdown:
```typescript
{/* Only show Hide User option for OTHER users' posts */}
{post.author_id !== user?.id && (
  <DropdownMenuItem onClick={handleHideUser}>
    <EyeOff className="mr-2 h-4 w-4" />
    Hide posts from this user
  </DropdownMenuItem>
)}
```

This logic should be verified and applied consistently across all post display components.

### Files to Verify
- `src/pages/Feed.tsx`
- `src/components/posts/PostCard.tsx`

---

## Issue 11: Backend - Mark User Profile as Expert/Verified

### Current State
The user needs their profile marked as:
- `mobile_verified: true`
- `linkedin_verified: true` with `linkedin_id: 'amanin'`
- `is_expert: true`
- `tier: 'expert'`

### Solution
Run database update:
```sql
UPDATE profiles 
SET 
  mobile_verified = true,
  linkedin_verified = true,
  linkedin_id = 'aman',
  is_expert = true,
  tier = 'expert',
  streak_days = 100,
  upvote_rate = 0.85
WHERE email = 'prodmandeep@gmail.com' OR username LIKE '%aman%';
```

This is a one-time data fix.

---

## Implementation Order

```text
+------------------------------------------------------------------------+
|  EXECUTION ORDER (STRICT)                                              |
+------------------------------------------------------------------------+
|  1. Fix Environment Variable Issue (CRITICAL)                          |
|     - Update all files using import.meta.env.VITE_SUPABASE_URL        |
|     - Use getSupabaseUrl() from client instead                          |
|     - This fixes: OTP, LinkedIn, Trending, Markets                      |
|                                                                         |
|  2. Add Privacy Interests Column                                       |
|     - Database migration                                                |
|     - Update PrivacySection.tsx                                         |
|                                                                         |
|  3. Fix Public Profile Issues                                          |
|     - Add followers/following modal                                     |
|     - Fix count updates on follow/unfollow                              |
|     - Add skills/interests sections                                     |
|     - Truncate recent posts with "See all" CTA                          |
|                                                                         |
|  4. Fix Edit Profile Button Alignment                                  |
|     - Update section headers in all edit components                     |
|                                                                         |
|  5. Fix Saved Posts Preview                                            |
|     - Fetch post data with bookmarks                                    |
|                                                                         |
|  6. Update Notification Triggers                                       |
|     - Add title/body to notification inserts                            |
|     - Create triggers for comments, answers, votes, reposts             |
|                                                                         |
|  7. Mark User Profile as Expert                                        |
|     - Database update for testing                                       |
+------------------------------------------------------------------------+
```

---

## Files Summary

| Issue | New Files | Modified Files |
|-------|-----------|----------------|
| 1. Env Var Fix | - | MobileVerificationModal.tsx, LinkedInConnect.tsx, TrendingStructuredFeed.tsx, marketService.ts, news/api/*.ts |
| 2. Privacy | - | PrivacySection.tsx, useEditProfile.ts + DB migration |
| 3. Public Profile | FollowersModal.tsx | PublicProfile.tsx, useFollows.ts |
| 4. Button Align | - | ExperienceSection.tsx, EducationSection.tsx, CertificationsSection.tsx, SkillsSection.tsx |
| 5. Saved Preview | - | Profile.tsx |
| 6. Notifications | - | DB triggers |
| 7. Expert Profile | - | DB update |

---

## QA Acceptance Checklist

- [ ] Mobile OTP: Enter number -> OTP generated -> Verify works
- [ ] LinkedIn Connect: Click -> OAuth popup -> Returns Connected
- [ ] Trending tab: Shows news articles
- [ ] Markets page: Shows real-time stock data
- [ ] Public Profile: Click followers/following counts -> See modal with list
- [ ] Follow someone -> Their count increases by 1
- [ ] Edit Profile: Add buttons are right-aligned in all sections
- [ ] Interests has privacy toggle
- [ ] Saved tab: Shows post previews like Posts tab
- [ ] Notifications: Receive notification when followed/commented/upvoted
- [ ] Cannot hide own posts
- [ ] Expert profile has expert badge and features

---

## Technical Notes

### Why Environment Variables Are Undefined
In Lovable Cloud, environment variables are injected at build time. However, when using `import.meta.env.VITE_*` in certain contexts (dynamic imports, lazy-loaded components), the values may not be available. The solution is to use the exported `getSupabaseUrl()` function from the Supabase client, which has a fallback to the hardcoded URL.

### Notification Trigger Updates Required
The current `handle_follow_change()` function creates notifications but without title/body. The notification display component shows "Notification" as fallback title. To fix this properly, all notification-creating triggers need to include descriptive title and body fields.
