

# InvestorPaisa Production Readiness Implementation Plan

## Executive Summary

This plan addresses 7 specific production issues in strict execution order. Each fix includes root cause analysis, implementation details, and verification criteria.

---

## Issue 1: Sign-up/Sign-in Flow Enhancement

### Current State Analysis
- **Problem 1**: After email OTP verification, the system falls back to a magic link flow (`signInWithOtp`) when no session is returned from `auth-complete`
- **Problem 2**: Users see "Check your email!" and must click another link to complete sign-in
- **Problem 3**: No verification prompt shown after successful authentication

### Root Cause
The `auth-complete` edge function creates users but doesn't generate JWT sessions directly. The current fallback uses Supabase's `signInWithOtp` which sends another email.

### Technical Solution

#### A. Fix `auth-complete` Edge Function to Generate Session
Update `supabase/functions/auth-complete/index.ts` to generate proper JWT tokens using the admin API:

```text
Changes Required:
1. After user creation/lookup, use admin.generateLink() to create session
2. Return proper access_token and refresh_token
3. Remove fallback to magic link completely
```

#### B. Update Auth.tsx Flow
1. Remove the magic link fallback code (lines 187-206)
2. After successful OTP verification with session:
   - For NEW users: Redirect to `/feed` with verification modal overlay
   - For EXISTING users: Redirect directly to `/feed`
3. Store `isNewUser` flag to trigger verification modal

#### C. Add Verification Modal on Feed for New Users
1. Create a state to track if user just signed up
2. Show `VerificationModal` as dismissable overlay on `/feed` for new sign-ups
3. Update `VerificationModal` to navigate to `/profile/edit` with auto-scroll

#### D. Google OAuth Flow
1. After Google sign-in callback, check if user is new (profile just created)
2. If new user, show verification modal overlay on feed
3. If existing user, proceed directly to feed

### Files Modified
- `supabase/functions/auth-complete/index.ts`
- `src/pages/Auth.tsx`
- `src/pages/Feed.tsx` (add verification modal trigger)
- `src/components/auth/VerificationModal.tsx` (update navigation)

---

## Issue 2: Desktop Card - 3-Dot Menu Position

### Current State Analysis
Looking at the reference screenshot (image-3.png), the 3-dot menu should be sticky to the top-right corner of the card widget. Current implementation has it inline with the header.

### Root Cause
CSS layout uses `flex justify-between` but doesn't enforce absolute positioning for the 3-dot menu.

### Technical Solution

Update `src/components/posts/PostCard.tsx` and `src/pages/Feed.tsx`:

```text
Card Header Structure:
- Make Card position: relative
- Position 3-dot menu as: absolute, top-3, right-3
- Remove 3-dot from flex row
- Header row: [ Avatar + Name + @username + time ] [ Type Badge ]
```

### CSS Changes
```css
/* Card wrapper */
.card { position: relative; }

/* 3-dot menu - absolute top right */
.three-dot-menu { 
  position: absolute; 
  top: 0.75rem; 
  right: 0.75rem; 
}
```

### Files Modified
- `src/components/posts/PostCard.tsx`
- `src/pages/Feed.tsx` (FeedPostCard component)
- `src/components/landing/LandingFeedPreview.tsx`

---

## Issue 3: Mobile Card Layout Fixes

### Current State Analysis
From the reference screenshot (Media_18.jpg):
- Card content overflows widget boundaries
- 3-dot menu should be at top-right with consistent padding
- Footer CTAs (Upvote, Downvote, Comment, Repost, Save) need equidistant spacing

### Root Cause
1. No max-width constraints on card content
2. Footer uses `gap` but not `justify-between` for equidistant distribution
3. Mobile padding inconsistent

### Technical Solution

#### A. Card Content Overflow Fix
```css
/* Apply to CardContent */
.card-content {
  overflow-wrap: break-word;
  word-break: break-word;
}
```

#### B. Footer CTA Equidistant Layout
```css
/* Mobile footer: equidistant CTAs */
@media (max-width: 640px) {
  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
  }
}
```

#### C. Consistent Padding
- Card: `px-3` on mobile
- Header/Footer: `p-3`
- Ensure 3-dot menu has consistent margin from card edge

### Files Modified
- `src/components/posts/PostCard.tsx`
- `src/pages/Feed.tsx` (FeedPostCard)
- `src/components/landing/LandingFeedPreview.tsx`

---

## Issue 4: Report Content and Hide User Posts

### Current State Analysis
- Dropdown menu shows "Report content" and "Hide posts from this user" items
- No handlers are attached - clicking does nothing
- No database tables for content reports or hidden users

### Technical Solution

#### A. Create Database Tables

```sql
-- Content Reports Table
CREATE TABLE public.content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('post', 'comment', 'answer')),
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(reporter_id, entity_id, entity_type)
);

-- Hidden Users Table
CREATE TABLE public.hidden_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  hidden_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, hidden_user_id)
);

-- Enable RLS
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hidden_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create reports" ON public.content_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports" ON public.content_reports
  FOR SELECT TO authenticated USING (auth.uid() = reporter_id);

CREATE POLICY "Users can manage hidden users" ON public.hidden_users
  FOR ALL TO authenticated USING (auth.uid() = user_id);
```

#### B. Create Report Modal Component
New file: `src/components/moderation/ReportContentModal.tsx`
- Dropdown with reason options (Spam, Harassment, Misinformation, etc.)
- Optional description field
- Submit button

#### C. Create Hooks
- `src/hooks/useContentReports.ts` - mutation to submit report
- `src/hooks/useHiddenUsers.ts` - mutation to hide/unhide user

#### D. Update Feed Query to Filter Hidden Users
In `src/pages/Feed.tsx`, add filter:
```typescript
// Get hidden user IDs
const { data: hiddenUsers } = useHiddenUsers();
const hiddenIds = hiddenUsers?.map(h => h.hidden_user_id) || [];

// Filter posts
const filteredPosts = posts.filter(p => !hiddenIds.includes(p.author_id));
```

#### E. Wire Up Dropdown Menu Handlers
Update PostCard and FeedPostCard to:
1. Open ReportContentModal on "Report content" click
2. Call `hideUser` mutation on "Hide posts from this user" click
3. Show toast confirmation

### Files Created
- `src/components/moderation/ReportContentModal.tsx`
- `src/hooks/useContentReports.ts`
- `src/hooks/useHiddenUsers.ts`

### Files Modified
- `src/components/posts/PostCard.tsx`
- `src/pages/Feed.tsx`
- Database migration

---

## Issue 5: Mobile OTP and LinkedIn Connect Fixes

### Root Cause Analysis

#### Mobile OTP Issue
1. **Potential Issue 1**: `VITE_SUPABASE_URL` returning undefined in frontend
2. **Potential Issue 2**: CORS headers in edge function may be incomplete
3. **Potential Issue 3**: MobileVerificationModal requires re-entering phone number

#### LinkedIn Connect Issue
1. **Potential Issue 1**: Redirect URI mismatch (must be registered in LinkedIn Dev Console)
2. **Potential Issue 2**: CORS headers incomplete in edge function

### Technical Solution

#### A. Fix Mobile OTP Flow

1. **Update MobileVerificationModal.tsx**:
   - Remove phone input step when triggered from Edit Profile
   - Accept `initialPhone` prop from parent
   - Start directly on OTP input step
   - Add resend functionality with countdown timer

2. **Update ContactVerificationSection.tsx**:
   - Pass current phone number to modal
   - Modal opens directly on OTP step

3. **Fix Edge Function CORS**:
   - Update `auth-mobile-verify-otp/index.ts` CORS headers to match request pattern

#### B. Fix LinkedIn Connect Flow

1. **Verify Redirect URI**:
   - Must be `https://investorpaisa.com/profile/edit` (production)
   - Or `https://[preview-id].lovable.app/profile/edit` (preview)

2. **Update Edge Function CORS**:
   - Ensure complete CORS header set in `auth-linkedin-connect/index.ts`

3. **Add Error Logging**:
   - Enhanced console logging for debugging token exchange

### Files Modified
- `src/components/profile/MobileVerificationModal.tsx`
- `src/components/profile/edit/ContactVerificationSection.tsx`
- `supabase/functions/auth-mobile-request-otp/index.ts` (CORS update)
- `supabase/functions/auth-mobile-verify-otp/index.ts` (CORS update)
- `supabase/functions/auth-linkedin-connect/index.ts` (CORS update)

---

## Issue 6: Post-Verification Navigation and Access Control

### Current State Analysis
- VerificationModal currently navigates to `/edit-profile?tab=verification` (wrong route)
- Correct route is `/profile/edit`
- Need auto-scroll to verification section
- Access control for verified/unverified users partially implemented

### Technical Solution

#### A. Fix VerificationModal Navigation
Update `src/components/auth/VerificationModal.tsx`:
```typescript
const handleMobileVerify = () => {
  onOpenChange(false);
  navigate('/profile/edit');
  // Auto-scroll handled by URL hash or ref
  setTimeout(() => {
    document.getElementById('verification-section')?.scrollIntoView({ behavior: 'smooth' });
  }, 300);
};
```

#### B. Add Section ID to ProfileEdit
Update `src/components/profile/edit/ContactVerificationSection.tsx`:
```tsx
<Card id="verification-section" className="...">
```

#### C. Enable Features on Verification
The `useUserTier` hook already handles tier-based permissions. Ensure:
1. `mobile_verified = true` OR `linkedin_verified = true` promotes user to `verified_user`
2. UI updates reactively on profile change
3. Add `refreshProfile()` call after verification success

### Files Modified
- `src/components/auth/VerificationModal.tsx`
- `src/components/profile/edit/ContactVerificationSection.tsx`
- `src/components/profile/edit/SocialProfilesSection.tsx`
- `src/pages/ProfileEdit.tsx` (add refresh logic)

---

## Issue 7: Repost with Opinion Feature

### Current State Analysis
- Current repost is a simple toggle (add/remove repost)
- No UI for adding opinion text
- No preview of original post attached

### Technical Solution

#### A. Create Repost Modal Component
New file: `src/components/posts/RepostWithOpinionModal.tsx`
- Shows original post preview (read-only card)
- Text input for user's opinion
- "Repost" button

#### B. Update Database Schema
```sql
-- Add opinion field to reposts table
ALTER TABLE public.reposts ADD COLUMN IF NOT EXISTS opinion TEXT;
```

#### C. Update useReposts Hook
Modify mutation to accept optional opinion text:
```typescript
mutationFn: async ({ postId, opinion }: { postId: string; opinion?: string })
```

#### D. Update Feed to Show Reposts with Opinion
- Display repost card with:
  - Reposter's opinion at top
  - Embedded preview of original post
  - Click on preview navigates to original post

#### E. Wire Up Modal Trigger
Update FeedPostCard repost button to open RepostWithOpinionModal instead of direct toggle

### Files Created
- `src/components/posts/RepostWithOpinionModal.tsx`

### Files Modified
- `src/hooks/useReposts.ts`
- `src/pages/Feed.tsx`
- `src/components/posts/PostCard.tsx`
- Database migration for reposts.opinion column

---

## Implementation Order

```text
+------------------------------------------------------------------------+
|  EXECUTION ORDER (STRICT)                                              |
+------------------------------------------------------------------------+
|  1. Issue 1 - Sign-up/Sign-in Flow                                     |
|     - Fix auth-complete to return session                              |
|     - Update Auth.tsx to remove magic link fallback                    |
|     - Add verification modal trigger for new users                     |
|                                                                         |
|  2. Issue 5 - Mobile OTP + LinkedIn Fixes                              |
|     - Fix CORS headers in edge functions                               |
|     - Update MobileVerificationModal to skip phone input               |
|     - Deploy and test                                                   |
|                                                                         |
|  3. Issue 6 - Navigation and Access Control                            |
|     - Fix VerificationModal navigation to /profile/edit                |
|     - Add auto-scroll to verification section                          |
|     - Ensure profile refresh after verification                        |
|                                                                         |
|  4. Issues 2 & 3 - Card Layout Fixes (Desktop + Mobile)                |
|     - Fix 3-dot menu positioning (absolute top-right)                  |
|     - Fix mobile content overflow                                       |
|     - Make footer CTAs equidistant                                      |
|                                                                         |
|  5. Issue 4 - Report Content + Hide User                               |
|     - Create database tables                                            |
|     - Create ReportContentModal                                         |
|     - Create hooks                                                      |
|     - Wire up handlers                                                  |
|                                                                         |
|  6. Issue 7 - Repost with Opinion                                      |
|     - Add opinion column to reposts                                     |
|     - Create RepostWithOpinionModal                                     |
|     - Update feed to display opinions                                   |
+------------------------------------------------------------------------+
```

---

## Files Summary

| Category | New Files | Modified Files |
|----------|-----------|----------------|
| Auth | - | `supabase/functions/auth-complete/index.ts`, `src/pages/Auth.tsx`, `src/pages/Feed.tsx` |
| Edge Functions | - | `auth-mobile-request-otp`, `auth-mobile-verify-otp`, `auth-linkedin-connect` |
| Moderation | `src/components/moderation/ReportContentModal.tsx`, `src/hooks/useContentReports.ts`, `src/hooks/useHiddenUsers.ts` | - |
| Repost | `src/components/posts/RepostWithOpinionModal.tsx` | `src/hooks/useReposts.ts` |
| Profile | - | `src/components/auth/VerificationModal.tsx`, `src/components/profile/MobileVerificationModal.tsx`, `src/components/profile/edit/ContactVerificationSection.tsx` |
| Cards | - | `src/components/posts/PostCard.tsx`, `src/pages/Feed.tsx`, `src/components/landing/LandingFeedPreview.tsx` |
| Database | 2 migrations | - |

---

## QA Verification Checklist

- [ ] New user email OTP -> lands on feed with verification modal
- [ ] Existing user email OTP -> lands on feed without modal
- [ ] Google OAuth new user -> lands on feed with verification modal
- [ ] Google OAuth existing user -> lands on feed directly
- [ ] Mobile OTP: Verify button opens OTP input directly (no phone re-entry)
- [ ] Mobile OTP: OTP verifies and profile updates immediately
- [ ] LinkedIn: Connect opens popup and returns with success
- [ ] Verification modal -> navigates to /profile/edit, scrolls to section
- [ ] 3-dot menu: sticky top-right on desktop
- [ ] Mobile: no content overflow, equidistant CTAs
- [ ] Report content: modal opens, reason submitted, toast shown
- [ ] Hide user: posts filtered from feed, toast shown
- [ ] Repost: modal opens with opinion input and preview
- [ ] Clicking repost preview navigates to original post

---

## Hard Stop Constraints

The following will NOT be modified:
- Market data logic
- Feed ranking algorithms
- AI flows
- Navigation structure
- Design tokens
- Any feature not explicitly listed in the 7 issues above

