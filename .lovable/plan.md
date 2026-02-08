
# InvestorPaisa Stability & Bug Fix Plan

## Executive Summary
This plan addresses 9 critical issues across authentication, messaging, data synchronization, UI consistency, and content management. Each fix includes Root Cause Analysis (RCA), backend changes, frontend fixes, and validation criteria.

---

## Issue 1: Message Sending Fails (RLS Violation)

### Root Cause Analysis
The RLS policy on the `conversations` table currently only allows INSERT for authenticated users with a simple check (`auth.uid() IS NOT NULL`). However, the `conversation_participants` table has a policy that only allows users to manage their OWN participations (`auth.uid() = user_id`). This creates a race condition:

1. User A creates a conversation (allowed)
2. User A tries to add User B as a participant (BLOCKED - User A's `auth.uid()` != User B's `user_id`)

The current flow in `useSendMessage.ts` attempts to insert participants for both users, but RLS blocks the second insert.

### Backend Fix
Create a SECURITY DEFINER function to safely create conversations with both participants:

```sql
CREATE OR REPLACE FUNCTION public.get_or_create_dm_conversation(
  p_user_a uuid,
  p_user_b uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id uuid;
BEGIN
  -- Check for existing conversation
  SELECT cp1.conversation_id INTO v_conversation_id
  FROM conversation_participants cp1
  JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
  JOIN conversations c ON c.id = cp1.conversation_id
  WHERE cp1.user_id = p_user_a 
    AND cp2.user_id = p_user_b
    AND c.is_group = false
  LIMIT 1;

  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  -- Create new conversation
  INSERT INTO conversations (is_group, type)
  VALUES (false, 'direct')
  RETURNING id INTO v_conversation_id;

  -- Add both participants
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES 
    (v_conversation_id, p_user_a),
    (v_conversation_id, p_user_b);

  RETURN v_conversation_id;
END;
$$;
```

### Frontend Fix
Update `useSendMessage.ts` to use the new RPC function instead of direct inserts.

### Validation
- User A can message User B (first message creates conversation)
- User B can reply to User A (reuses same conversation)
- No duplicate conversations created

---

## Issue 2: Repost Not Appearing in Profile

### Root Cause Analysis
Current repost logic in `useReposts.ts` only inserts into the `reposts` table - it doesn't create a new `posts` entry. The Profile page queries `posts` table filtered by `author_id`, so reposts never appear.

The expected behavior (per requirements) is that a repost should create a NEW post entry with:
- `type: 'repost'`
- `original_post_id: [original post ID]`
- `author_id: current_user`
- Independent engagement counters (upvotes=0, etc.)

### Backend Fix
The `posts` table already has `original_post_id` column. No schema change needed.

### Frontend Fix
Update `useCreateRepostWithOpinion` in `useReposts.ts` to:
1. Create a new `posts` entry with `type: 'repost'` and `original_post_id`
2. Also create the `reposts` table entry for the unique constraint
3. Invalidate both feed and profile queries

### Validation
- Repost appears in user's Profile > Posts tab
- Engagement counts are independent (upvoting repost doesn't affect original)
- Original post counters remain unchanged

---

## Issue 3: Upvote Count Desync Across Pages

### Root Cause Analysis
The `useToggleReaction` mutation in `useReactions.ts` only invalidates these query keys:
- `['reaction', entityId]`
- `['reactions', entityId]`
- `['posts']`
- `['post', entityId]`

Missing invalidations:
- `['feed']` (used by Feed.tsx infinite query)
- `['user-posts', profileId]` (used by Profile.tsx)

### Frontend Fix
Update `useToggleReaction` to invalidate all relevant queries:

```typescript
onSuccess: (result, variables) => {
  queryClient.invalidateQueries({ queryKey: ['reaction', variables.entityId] });
  queryClient.invalidateQueries({ queryKey: ['reactions', variables.entityId] });
  queryClient.invalidateQueries({ queryKey: ['posts'] });
  queryClient.invalidateQueries({ queryKey: ['post', variables.entityId] });
  queryClient.invalidateQueries({ queryKey: ['feed'] }); // ADD
  queryClient.invalidateQueries({ queryKey: ['user-posts'] }); // ADD (broad invalidation)
};
```

### Validation
- Upvote on post detail page reflects immediately on Feed
- Upvote on Feed reflects on Profile
- Counts stay consistent on page refresh

---

## Issue 4: Tag Color Inconsistency (Question/Opinion/News)

### Root Cause Analysis
Multiple components define their own Badge styling for post types:
- `Feed.tsx` line 369: `bg-primary/10 text-primary border-primary/30`
- `PostCard.tsx` line 164-165: `bg-primary/10 text-primary border-primary/30`
- `PostDetail.tsx` line 320: `variant="outline"` (no color override)

PostDetail uses the default outline variant which has different styling.

### Frontend Fix
Create a shared utility or apply the consistent class across all files:

```typescript
// Standard post type badge styling (Teal/Cyan)
className="bg-primary/10 text-primary border-primary/30 text-[10px] capitalize h-5 px-1.5"
```

Update:
- `PostDetail.tsx` line 320

### Validation
- Tag color identical on Feed, Profile, and Post Detail pages
- All use the teal/cyan primary color scheme

---

## Issue 5: Secondary Nav Overlapping Top Nav

### Root Cause Analysis
Current z-index hierarchy:
- Top Nav (MainLayout): `z-40`
- Mobile Top Bar: `z-40`
- Feed Tab Bar: `z-30` with `sticky top-12`

The issue is that `top-12` (48px) doesn't account for the exact top nav height on all viewports. Additionally, on scroll, the backdrop blur can cause visual overlap.

### Frontend Fix
Update `Feed.tsx` tab bar:
- Increase top offset to match nav height exactly
- Use CSS variable or consistent calculation

```tsx
// Line 718 in Feed.tsx
<div className="sticky top-[48px] z-30 bg-background/95 backdrop-blur-sm pt-1 pb-3 -mx-2 px-2 sm:-mx-4 sm:px-4">
```

For mobile, adjust to `top-12` (48px matches MobileTopBar height of h-12).

### Validation
- Both navs visible without overlap on scroll
- Consistent on mobile and desktop
- Tab bar doesn't cover any content

---

## Issue 6: News Cards Not Rendering Images

### Root Cause Analysis
Examining the database data shows image URLs like:
`https://source.unsplash.com/800x450/?business,economy`

The `isValidImageUrl` helper in `TrendingStructuredFeed.tsx` (lines 103-106) correctly validates these URLs. However, examining the screenshot shows raw HTML/anchor tags in the description area, suggesting the RSS parsing might be returning malformed data.

The RSS fetcher (`fetch-google-rss/index.ts`) has proper image extraction logic, but the image URLs may be dynamic Unsplash URLs that require specific loading.

### Backend Fix
Update `fetch-google-rss/index.ts` to:
1. Better extract actual article images from media tags
2. Use more reliable placeholder images (static, not dynamic Unsplash)

### Frontend Fix
Ensure `TrendingStructuredFeed.tsx` properly handles:
1. Add `crossOrigin="anonymous"` to img tags for external images
2. Improve error handling to show placeholder instead of hiding

### Validation
- Images render for news cards
- Graceful fallback for broken images
- No layout breaks

---

## Issue 7: Comments Engagement Inconsistency

### Root Cause Analysis
Current comment actions use `like_count` field. Per requirements, comments should have:
- Upvote/Downvote (matching posts)
- GIF support
- No repost/bookmark

The `comments` table has `like_count` but not separate `upvote_count`/`downvote_count`. However, the `reactions` table already supports `entity_type: 'comment'` with reaction types including upvote/downvote.

### Frontend Fix
Update comment rendering (in `PostDetail.tsx` and wherever answers are displayed) to:
1. Show ↑↓ buttons instead of like button
2. Use `useToggleReaction` with `entityType: 'comment'`
3. Add GIF picker option

### Validation
- Comments show upvote/downvote icons
- Reactions work correctly
- No repost/bookmark on comments

---

## Issue 8: Delete Flow Missing/Inconsistent

### Root Cause Analysis
The 3-dot menu on posts shows Report and Hide options but NOT a Delete option for the content owner. The `PostDetail.tsx` menu (lines 415-428) only shows Report/Hide for OTHER users' posts - no delete for own posts.

### Frontend Fix

**For Posts:**
Update `PostDetail.tsx`, `PostCard.tsx`, and `Feed.tsx` to add Delete option in 3-dot menu when `post.author_id === user?.id`:

```tsx
{post.author_id === user?.id && (
  <DropdownMenuItem 
    onClick={handleDelete}
    className="text-destructive"
  >
    <Trash2 className="mr-2 h-4 w-4" />
    Delete
  </DropdownMenuItem>
)}
```

**For Comments:**
Add inline delete icon (or long-press on mobile) when `comment.author_id === user?.id`.

**Confirmation Modal:**
Create a reusable `DeleteConfirmModal` component with:
- Title: "Delete this?"
- CTAs: Delete (destructive), Cancel

**Navigation After Delete:**
- Post: Navigate back to source page (history.back or /feed)
- Comment: Stay on same page, remove inline

### Validation
- Delete appears for own content only
- Confirmation modal shows
- Soft delete applied (deleted_at set)
- Proper navigation after delete

---

## Issue 9: Google Sign-In Still Failing

### Root Cause Analysis
The current OAuth flow in `AuthContext.tsx` processes tokens correctly but the redirect may be losing the session. Key issues:

1. `redirect_uri` is set to `/feed` which may not match configured callback URLs
2. The `oauthProcessedRef` flag prevents re-processing but may fire too early
3. Profile creation race condition during OAuth callback

### Frontend Fix

1. Update `signInWithGoogle` to use origin without path:
```typescript
redirect_uri: window.location.origin, // Not window.location.origin + '/feed'
```

2. Ensure `processOAuthCallback` runs before any redirect check:
```typescript
// Check hash on any page, not just specific routes
const hash = window.location.hash;
if (hash && hash.includes('access_token')) {
  // Process immediately
}
```

3. Add explicit session check after setSession:
```typescript
const { data: sessionCheck } = await supabase.auth.getSession();
if (sessionCheck.session) {
  // Session confirmed - safe to proceed
}
```

### Validation
- Google login lands user in authenticated experience
- Session persists on refresh
- Profile created/loaded correctly
- No redirect back to logged-out state

---

## Implementation Order (Strict Sequence)

| Order | Issue | Files to Modify |
|-------|-------|-----------------|
| 1 | Google Auth | `AuthContext.tsx` |
| 2 | Message RLS | Migration SQL, `useSendMessage.ts` |
| 3 | Repost Profile | `useReposts.ts` |
| 4 | Upvote Sync | `useReactions.ts` |
| 5 | Tag Colors | `PostDetail.tsx` |
| 6 | Nav Z-Index | `Feed.tsx` |
| 7 | News Images | `fetch-google-rss/index.ts`, `TrendingStructuredFeed.tsx` |
| 8 | Comment Actions | `PostDetail.tsx`, `NewsDetail.tsx` |
| 9 | Delete Flow | `PostCard.tsx`, `PostDetail.tsx`, `Feed.tsx` (+ new modal) |

---

## Technical Implementation Details

### Database Migration Required

```sql
-- Function for conversation creation
CREATE OR REPLACE FUNCTION public.get_or_create_dm_conversation(...)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  ...
```

### Files to Modify

1. **`src/contexts/AuthContext.tsx`** - OAuth redirect fix
2. **`src/hooks/useSendMessage.ts`** - Use RPC for conversation creation
3. **`src/hooks/useReposts.ts`** - Create posts entry on repost
4. **`src/hooks/useReactions.ts`** - Broader query invalidation
5. **`src/pages/PostDetail.tsx`** - Badge styling, delete option, comment actions
6. **`src/components/posts/PostCard.tsx`** - Delete option
7. **`src/pages/Feed.tsx`** - Tab bar positioning, delete option
8. **`src/components/feed/TrendingStructuredFeed.tsx`** - Image handling
9. **`supabase/functions/fetch-google-rss/index.ts`** - Better image extraction
10. **New: `src/components/ui/delete-confirm-modal.tsx`** - Reusable delete confirmation

---

## QA Acceptance Checklist

| Test Case | Expected Result |
|-----------|-----------------|
| Google sign-in | User lands in authenticated feed |
| Session refresh | User stays logged in |
| Send first message | Conversation created, message sent |
| Reply to message | Uses existing conversation |
| Repost content | Appears in Profile > Posts |
| Upvote on detail page | Reflects on Feed |
| Tag color everywhere | Consistent teal/cyan |
| Scroll feed | No nav overlap |
| News card images | Images render with fallback |
| Comment upvote/downvote | Works correctly |
| Delete own post | Confirmation shown, post removed |
| Delete own comment | Removed inline |
