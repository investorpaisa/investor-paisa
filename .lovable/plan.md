
# InvestorPaisa Comprehensive Feature Implementation Plan

## Overview

This plan implements a comprehensive set of features across 21 sections (A through U) covering:
- Logged-out landing page experience
- Authentication improvements
- Google News ingestion
- Profile menu changes
- Username confidentiality
- Voting, commenting, sharing, and repost systems
- Profile editing and verification
- Messaging with expert broadcasts
- Communities
- Create flow
- Trending page structure
- Analytics events
- Error states

---

## Current State Analysis

### What Already Exists:
- Landing page with feed preview (`Landing.tsx`)
- OTP-based email auth flow (`Auth.tsx`)
- Google OAuth support
- Reactions system (like/upvote/downvote via `useReactions.ts`)
- Comments system (`useComments.ts`)
- Profile page with logout button
- Feed with Pulse/Trending/Following tabs
- News articles table and crawler edge function
- Basic post cards showing full name and avatar
- Communities table structure exists

### What Needs to Be Built/Modified:
- AuthGateModal component (reusable)
- Landing page search functionality
- Hide "Following" tab for logged-out users
- Username-only display (hide avatars/real names for logged-out)
- Sticky "Start" CTA on landing
- News API integration with cron polling
- Profile menu with Edit/Logout
- Upvote/Downvote UI refinements
- Share functionality
- Repost system
- Edit profile simplification
- LinkedIn OAuth connection
- Mobile OTP verification
- Expert mass messaging
- Community post visibility in Following feed
- Trending page structure with promoted content
- Analytics event tracking

---

## PHASE 1: Auth Gate Modal & Landing Page Updates

### 1.1 Create AuthGateModal Component
**New File:** `src/components/auth/AuthGateModal.tsx`

Reusable modal for any interaction gating:
```typescript
interface AuthGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}
// Shows:
// - Title: "Create free account to interact"
// - Continue with Google button
// - Continue with Email button  
// - Cancel button
```

### 1.2 Update Landing Page (`src/pages/Landing.tsx`)

**Changes:**
- Add centered search input in header (placeholder: "Search posts, people, topics...")
- Remove right icons from header (already mostly done)
- Replace existing auth modal with AuthGateModal
- Add sticky bottom "Start" CTA button
- Update feed tabs to show only Pulse and Trending (no Following)

### 1.3 Update LandingFeedPreview (`src/components/landing/LandingFeedPreview.tsx`)

**Changes:**
- Add tab navigation for Pulse/Trending
- Show @username only (hide avatar and full name for logged-out users)
- Wire up search API when implemented
- Gate all interactions (upvote, downvote, comment, share, username click) with AuthGateModal

---

## PHASE 2: Search API Implementation

### 2.1 Create Search API Endpoint
**New File:** `supabase/functions/search/index.ts`

Endpoint: `GET /search?q=<query>&limit=3`

Returns:
- posts: matching posts by title/body
- users: matching profiles by username
- topics: matching topics by name

### 2.2 Create Search Hook
**New File:** `src/hooks/useSearch.ts`

```typescript
export const useSearch = (query: string, limit: number = 3) => {
  return useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      // Search posts, profiles, topics in parallel
    },
    enabled: query.length >= 1,
    debounceTime: 150
  });
};
```

### 2.3 Update SearchTypeahead Component
**File:** `src/components/search/SearchTypeahead.tsx`

- Replace mock data with real API calls
- Show categories: Posts, People, Topics (max 3 each)
- On result click → navigate to detail page
- If logged-out user clicks → show AuthGateModal

---

## PHASE 3: Username Confidentiality

### 3.1 Update Post Cards for Logged-Out Users

**Files to Modify:**
- `src/components/landing/LandingFeedPreview.tsx`
- `src/pages/Feed.tsx` (FeedPostCard component)
- `src/components/posts/PostCard.tsx`

**Logic:**
```typescript
const { user } = useAuth();
const isLoggedOut = !user;

// If logged out:
// - Hide Avatar component
// - Hide full_name, show only @username
// - Show post counts (likes, comments)
```

### 3.2 Update Profile Display Everywhere

For all public-facing components, when viewer is logged out:
- Show only `@username`
- Hide avatar_url
- Hide full_name, headline, bio preview

---

## PHASE 4: Voting System Refinement

### 4.1 Current State
The `useReactions.ts` hook already supports:
- `reaction_type: 'like' | 'upvote' | 'downvote' | 'save'`
- Toggle functionality

### 4.2 Required Changes

**Update FeedPostCard in Feed.tsx:**
- Replace Heart icon with ArrowUp/ArrowDown icons
- Show upvote count (calculated as upvotes - downvotes)
- Toggle on second tap (already implemented)
- Optimistic UI updates

**API Already Exists:**
```typescript
// POST via useToggleReaction
toggleReaction.mutate({
  entityId: post.id,
  entityType: 'post',
  reactionType: 'upvote' // or 'downvote'
});
```

---

## PHASE 5: Comment System (Already Implemented)

### Current Implementation
`src/hooks/useComments.ts` already provides:
- `useComments(postId)` - fetch comments
- `useCreateComment()` - create with parent_id support
- `useDeleteComment()` - soft delete

**Minor Enhancement:**
- Ensure tree structure rendering in PostDetail.tsx
- Add reply UI

---

## PHASE 6: Share System

### 6.1 Share Post
**Already Partially Implemented in Feed.tsx:**
```typescript
const handleShare = async (e) => {
  await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
  toast.success('Link copied to clipboard');
};
```

**Enhancement:**
- Use Web Share API when available
- Fallback to clipboard
- Track analytics event

### 6.2 Share Profile
**Add to Profile.tsx:**
```typescript
const handleShareProfile = async () => {
  const url = `${window.location.origin}/user/${profile.username}`;
  if (navigator.share) {
    await navigator.share({ url, title: `@${profile.username}` });
  } else {
    await navigator.clipboard.writeText(url);
  }
};
```

---

## PHASE 7: Repost System

### 7.1 Database Migration
```sql
CREATE TABLE IF NOT EXISTS public.reposts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.reposts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reposts" ON public.reposts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Reposts are viewable" ON public.reposts
  FOR SELECT USING (true);
```

### 7.2 Create Repost Hook
**New File:** `src/hooks/useReposts.ts`

```typescript
export const useToggleRepost = () => {
  // Insert or delete repost
  // Creates feed entry referencing original
};

export const useIsReposted = (postId: string) => {
  // Check if current user reposted
};
```

---

## PHASE 8: Edit Profile Simplification

### 8.1 Simplify ProfileEditForm
**File:** `src/components/profile/ProfileEditForm.tsx`

**Required Fields Only:**
- Username (immutable - display only)
- Bio
- LinkedIn URL
- Mobile

Retain: full_name, headline, location, industry, company, phone, website, twitter_url, experience, education, skills

Mandatory: Username, full_name, Email

### 8.2 API
Already uses Supabase client to update profiles table.

---

## PHASE 9: Profile Menu Changes

### 9.1 Update Profile Page
**File:** `src/pages/Profile.tsx`

Add 3-dot menu in top right (for own profile):
```tsx
<DropdownMenu>
  <DropdownMenuTrigger>
    <MoreHorizontal />
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => navigate('/edit-profile')}>
      Edit Profile
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleLogout}>
      Log out
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### 9.2 Remove Logout from Elsewhere
- Verify logout is not in MainNav, MobileTopBar, or Settings

---

## PHASE 10: LinkedIn OAuth Connection

### 10.1 Create LinkedIn Connect Edge Function
**New File:** `supabase/functions/auth-linkedin-connect/index.ts`

OAuth flow:
1. Redirect to LinkedIn authorization
2. Receive callback with code
3. Exchange for access token
4. Get LinkedIn profile
5. Store linkedin_id in profiles table

### 10.2 Add LinkedIn Column to Profiles
```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_id TEXT;
```

### 10.3 Add UI in Edit Profile
Button: "Connect LinkedIn" → initiates OAuth flow

---

## PHASE 11: Mobile OTP Verification

### 11.1 Create Mobile OTP Edge Functions
**New Files:**
- `supabase/functions/auth-mobile-request-otp/index.ts`
- `supabase/functions/auth-mobile-verify-otp/index.ts`

Using Supabase Auth phone provider or custom SMS gateway.

### 11.2 Update Profile
On successful verification: `mobile_verified = true`

### 11.3 Add UI in Edit Profile
- Mobile input field
- "Verify" button → opens OTP modal
- Show verified badge when complete

---

## PHASE 12: Google News Ingestion

### 12.1 Add NewsAPI Secret
**Secret Required:** `NEWSAPI_AI_KEY=00ae0b61-8914-4c05-8dae-0b729a55bb43`

### 12.2 Create News Poller Edge Function
**New File:** `supabase/functions/fetch-newsapi-articles/index.ts`

- Called via cron every 60 seconds
- Fetches from `https://newsapi.ai/api/v1/article/getArticles`
- Categories: business, finance, markets
- Language: en
- Upserts to news_articles table by URL

### 12.3 Update News Articles Table
```sql
ALTER TABLE public.news_articles 
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT;
```

### 12.4 Create News API Endpoints
**New Files:**
- Update existing edge functions or create:
  - `GET /news/trending` - returns latest news
  - `GET /news/markets?type=indian|global|crypto` - filtered news

---

## PHASE 13: Messaging System

### 13.1 Current State
Tables exist:
- conversations
- conversation_participants
- messages

Hooks exist:
- useConversations

### 13.2 Direct Message Enhancement
Ensure POST /conversations and POST /messages work correctly via Supabase client.

### 13.3 Expert Mass Outreach
**New File:** `supabase/functions/messages-mass/index.ts`

Only for expert tier users:
```typescript
// POST /messages/mass
{
  body: string,
  audience_filter: {
    interests?: string[],
    tier?: string[],
    follower_count_min?: number
  }
}
```

Creates individual messages with badge: "Expert Broadcast"

---

## PHASE 14: Communities Enhancement

### 14.1 Current State
Tables exist:
- communities
- community_members

### 14.2 Create Community Endpoint
Already possible via Supabase client:
```typescript
supabase.from('communities').insert({
  name,
  is_closed,
  creator_id: user.id
});
```

### 14.3 Post in Community
Add community_id to posts table:
```sql
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS community_id uuid REFERENCES communities(id);
```

### 14.4 Following Feed Logic
Update Feed.tsx to include community posts in Following tab:
```typescript
// In Following tab query:
// Get posts from followed users OR from communities user is member of
```

---

## PHASE 15: Create Flow Enhancement

### 15.1 Update CreateHub
**File:** `src/components/create/CreateHub.tsx`

Show options:
- Ask Question
- Share Opinion
- Create Community
- Brand Collaboration (Coming Soon badge - disabled)

### 15.2 Create Community Modal
**New File:** `src/components/communities/CreateCommunityModal.tsx`

Fields:
- Community name
- Open/Closed toggle
- Description

---

## PHASE 16: Trending Page Structure

### 16.1 Update Trending Tab in Feed
**File:** `src/pages/Feed.tsx`

Structure:
1. News Widget 1-4
2. Promoted Profile (from `/promotions/profiles`)
3. News Widget 5-8
4. Paid Services (from `/services/listings`)
5. Repeat pattern

### 16.2 Create Promotions API
**New File:** `supabase/functions/promotions-profiles/index.ts`

Returns promoted profiles for display in feed.

### 16.3 Influencer Leaderboard
**New File:** `supabase/functions/leaderboard-influencers/index.ts`

Returns top 10 influencers by follower count.

---

## PHASE 17: Analytics Events

### 17.1 Update Google Analytics Service
**File:** `src/services/analytics/googleAnalytics.ts`

Add new events:
```typescript
export const trackEvents = {
  landingView: () => trackEvent('landing_view', 'page'),
  authOpen: () => trackEvent('auth_open', 'auth'),
  signupSuccess: (method: string) => trackEvent('signup_success', 'auth', method),
  loginSuccess: (method: string) => trackEvent('login_success', 'auth', method),
  upvote: (postId: string) => trackEvent('upvote', 'engagement', postId),
  downvote: (postId: string) => trackEvent('downvote', 'engagement', postId),
  comment: (postId: string) => trackEvent('comment', 'engagement', postId),
  repost: (postId: string) => trackEvent('repost', 'engagement', postId),
  share: (type: string, id: string) => trackEvent('share', 'engagement', `${type}:${id}`),
  messageSend: () => trackEvent('message_send', 'messaging'),
};
```

### 17.2 Wire Events Throughout App
Add tracking calls to:
- Landing page mount
- Auth modal open
- Successful login/signup
- Vote actions
- Comment creation
- Repost action
- Share action
- Message send

---

## PHASE 18: Error States

### 18.1 Standard Error Component
**New File:** `src/components/ui/error-state.tsx`

```tsx
export const ErrorState: React.FC<{
  title?: string;
  description?: string;
  onRetry?: () => void;
}> = ({ title, description, onRetry }) => (
  <div className="flex flex-col items-center py-12">
    <AlertCircle className="h-10 w-10 text-destructive mb-4" />
    <h3 className="font-medium mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm mb-4">{description}</p>
    {onRetry && <Button onClick={onRetry}>Retry</Button>}
  </div>
);
```

### 18.2 Apply Everywhere
Ensure all data-fetching components have:
- Loading skeleton
- Empty state
- Error state with retry button

---

## Files Summary

### New Files to Create:
1. `src/components/auth/AuthGateModal.tsx` - Reusable auth gate
2. `src/hooks/useSearch.ts` - Search hook
3. `src/hooks/useReposts.ts` - Repost hook
4. `src/components/communities/CreateCommunityModal.tsx` - Community creation
5. `src/components/ui/error-state.tsx` - Standard error component
6. `supabase/functions/search/index.ts` - Search API
7. `supabase/functions/fetch-newsapi-articles/index.ts` - News poller
8. `supabase/functions/auth-linkedin-connect/index.ts` - LinkedIn OAuth
9. `supabase/functions/auth-mobile-request-otp/index.ts` - Mobile OTP request
10. `supabase/functions/auth-mobile-verify-otp/index.ts` - Mobile OTP verify
11. `supabase/functions/messages-mass/index.ts` - Expert mass messaging
12. `supabase/functions/promotions-profiles/index.ts` - Promoted profiles
13. `supabase/functions/leaderboard-influencers/index.ts` - Leaderboard

### Files to Modify:
1. `src/pages/Landing.tsx` - Add search, sticky CTA, tabs
2. `src/components/landing/LandingFeedPreview.tsx` - Username-only, tabs
3. `src/pages/Feed.tsx` - Upvote/downvote UI, username-only for logged-out
4. `src/pages/Profile.tsx` - 3-dot menu with Edit/Logout
5. `src/components/profile/ProfileEditForm.tsx` - Simplify fields
6. `src/components/create/CreateHub.tsx` - Add create options
7. `src/components/search/SearchTypeahead.tsx` - Real API integration
8. `src/services/analytics/googleAnalytics.ts` - Add new events

### Database Migrations:
1. Create `reposts` table
2. Add `linkedin_id` to profiles
3. Add `image_url`, `country` to news_articles
4. Add `community_id` to posts

### Secrets Required:
1. `NEWSAPI_AI_KEY` - Google News API key

---

## Implementation Order

1. **Phase 1-3**: AuthGateModal, Landing updates, Username confidentiality (core UX)
2. **Phase 4-6**: Voting, Comments refinement, Share (engagement features)
3. **Phase 7**: Repost system
4. **Phase 8-9**: Profile menu, Edit profile simplification
5. **Phase 10-11**: LinkedIn/Mobile verification
6. **Phase 12**: News ingestion
7. **Phase 13-14**: Messaging, Communities
8. **Phase 15-16**: Create flow, Trending structure
9. **Phase 17-18**: Analytics, Error states

---

## Regression Checklist

After implementation, verify:
- [ ] Landing loads without errors
- [ ] Search returns real results
- [ ] Trending shows news articles
- [ ] Google News cron stores rows in news_articles
- [ ] Auth (email OTP and Google) works
- [ ] Upvote/Downvote works with optimistic UI
- [ ] Comments load and can be created
- [ ] Messages page loads with empty state
- [ ] Profile menu shows Edit Profile and Log out
- [ ] Repost creates feed entry
- [ ] Analytics events fire correctly
