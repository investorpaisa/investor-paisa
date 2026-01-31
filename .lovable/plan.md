
# InvestorPaisa Targeted Product Implementation Plan

## Executive Summary
This plan implements 12 targeted changes to the InvestorPaisa platform, focusing on mobile UI optimization, removing the square IP logo, fixing Messages/Notifications/Profile loading issues, removing duplicate navigation, implementing role-aware composer, gamified profiles, closed communities, mass messaging, and Markets page restructuring.

---

## CHANGE 0: Mobile UI Spacing Optimization

### Problem
Mobile UI has excessive side spacing, reducing content visibility and discovery. Widgets appear narrow.

### Solution

**Files to Modify:**
- `src/layouts/MainLayout.tsx`
- `src/components/layout/MobileTopBar.tsx`
- `src/components/layout/MobileBottomNav.tsx`
- `src/pages/Feed.tsx`

**Frontend Changes:**

1. **MobileTopBar.tsx** - Reduce horizontal padding from `px-4` to `px-2`, increase widget heights
2. **Feed.tsx** - Reduce container padding from `px-4` to `px-2` on mobile, make tabs full-width
3. **MainLayout.tsx** - Ensure mobile layout uses minimal side padding
4. **Post cards** - Increase card sizes, reduce margins between cards

**CSS Changes:**
```tsx
// Feed.tsx - Mobile responsive container
<div className="container max-w-2xl mx-auto py-4 px-2 sm:px-4 md:py-6">
```

**Pulse Tab Logic:**
- Current "pulse" tab shows all approved posts ordered by created_at
- Update to show trending/open questions from across the platform:
```typescript
if (activeFeedTab === 'pulse') {
  query = query.eq('type', 'question').order('created_at', { ascending: false });
}
```

---

## CHANGE 1: Remove Square IP Logo

### Problem
Square IP logo appears in desktop/mobile top bars and Markets page header.

### Solution

**Files to Modify:**
- `src/layouts/MainLayout.tsx` (lines 69-73)
- `src/components/layout/MobileTopBar.tsx` (lines 26-29)
- `src/pages/Markets.tsx`

**Changes:**

1. **MainLayout.tsx** - Remove logo image, keep only text wordmark:
```tsx
<div 
  className="flex items-center space-x-2 cursor-pointer"
  onClick={() => navigate('/feed')}
>
  <span className="text-xl font-bold font-heading">
    Investor<span className="text-primary">Paisa</span>
  </span>
</div>
```

2. **MobileTopBar.tsx** - Same change, remove `<img>` tag, keep text logo

3. **Markets.tsx** - Remove MarketNav component entirely (it has duplicate nav) or remove any logo reference within it

---

## CHANGE 2: Messages & Notifications Loading Fix

### Root Cause Analysis

**Current State:**
- `src/pages/Inbox.tsx` - Shows only placeholder "coming soon" message
- `src/pages/MessagesNew.tsx` - Has search functionality but no conversation list
- `src/pages/Notifications.tsx` - Already has proper loading/error/empty states using `useNotifications` hook

**Backend Tables Exist:**
- `conversations` - id, is_group, name, created_at, updated_at
- `conversation_participants` - conversation_id, user_id, last_read_at, is_muted
- `messages` - id, conversation_id, sender_id, body, status, created_at
- `notifications` - id, user_id, type, title, body, actor_id, is_read, created_at

**Issues:**
1. `Inbox.tsx` doesn't query conversations - it's just a placeholder
2. No hooks exist for fetching conversations/messages
3. Notifications hook exists and works correctly

### Solution

**New Files to Create:**
- `src/hooks/useConversations.ts`
- `src/hooks/useMessages.ts`

**Files to Modify:**
- `src/pages/Inbox.tsx` - Complete rewrite to show conversation list

**useConversations.ts Hook:**
```typescript
export const useConversations = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      // Get conversation IDs user participates in
      const { data: participations } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id);
      
      // Get conversations with last message
      const { data: conversations } = await supabase
        .from('conversations')
        .select('*')
        .in('id', participations.map(p => p.conversation_id));
      
      return conversations || [];
    },
    enabled: !!user?.id,
  });
};
```

**Inbox.tsx Rewrite:**
- Add skeleton loading state
- Add empty state with "No conversations yet"
- Add error state with retry button
- List conversations with last message preview
- Navigate to individual conversation on click

---

## CHANGE 3: Remove Markets Page Duplicate Nav

### Problem
Markets page has its own `MarketNav` component (lines 181-229) in addition to global navigation.

### Solution

**File to Modify:**
- `src/pages/Markets.tsx`

**Changes:**
1. Remove the `MarketNav` component definition (lines 181-229)
2. Remove `<MarketNav />` from render (line 274)
3. The page will now use only the global navigation from `MainLayout`

---

## CHANGE 4: Profile Page Loading Fix

### Current State
`src/pages/Profile.tsx` already has:
- Loading skeleton (lines 118-135)
- Error state (lines 137-150)
- Proper query with `useQuery`

**Potential Issues:**
1. Check if RLS policies allow profile reads
2. Ensure auth token is attached

### Solution

**RLS Check:**
```sql
-- Verify SELECT policy exists for profiles
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

**Frontend Enhancement (Profile.tsx):**
- Ensure redirect to `/auth` uses correct path (currently correct)
- Add console logging for debugging

---

## CHANGE 5: Revamp Floating Ask Question (Role-Aware)

### New User Tier System

**Database Changes:**

Create new enum for user tiers:
```sql
CREATE TYPE public.user_tier AS ENUM (
  'guest',
  'unverified_user',
  'verified_user',
  'influencer',
  'expert'
);
```

Add to profiles table:
```sql
ALTER TABLE public.profiles 
ADD COLUMN tier user_tier DEFAULT 'unverified_user',
ADD COLUMN tier_verified_at TIMESTAMPTZ,
ADD COLUMN streak_days INTEGER DEFAULT 0,
ADD COLUMN upvote_rate DECIMAL DEFAULT 0,
ADD COLUMN mobile_verified BOOLEAN DEFAULT false,
ADD COLUMN linkedin_verified BOOLEAN DEFAULT false;
```

### Tier Progression Rules

| Tier | Requirement |
|------|-------------|
| guest | Not logged in |
| unverified_user | Email signup only |
| verified_user | Mobile OTP OR LinkedIn OAuth |
| influencer | 50+ day streak AND 70%+ upvote rate |
| expert | Certification OR 10k+ followers OR 100+ day streak |

### Permissions Matrix

| Action | UV | Verified | Influencer | Expert |
|--------|-----|----------|------------|--------|
| Like | Yes | Yes | Yes | Yes |
| Share | Yes | Yes | Yes | Yes |
| Comment | No | Yes | Yes | Yes |
| Ask Question | No | Yes | Yes | Yes |
| Post Opinion | No | Yes | Yes | Yes |
| AI Assist | No | Yes | Yes | Yes |
| Carousel | No | No | Yes | Yes |
| URL Summary | No | No | Yes | Yes |
| Profile Promotion | No | No | Yes | Yes |
| Paid Listing | No | No | No | Yes |
| Mass Outreach | No | No | No | Yes |

### Frontend Changes

**New Files:**
- `src/hooks/useUserTier.ts`
- `src/components/auth/VerificationModal.tsx`
- `src/components/create/RoleAwareComposer.tsx`

**useUserTier.ts:**
```typescript
export const useUserTier = () => {
  const { user, profile } = useAuth();
  
  // Compute tier from profile data
  const tier = useMemo(() => {
    if (!user) return 'guest';
    if (!profile?.mobile_verified && !profile?.linkedin_verified) return 'unverified_user';
    if (profile?.streak_days >= 50 && profile?.upvote_rate >= 0.7) return 'influencer';
    // ... expert logic
    return 'verified_user';
  }, [user, profile]);
  
  return { tier, canComment, canPost, canAsk, ... };
};
```

**Floating CTA Behavior:**

1. **Guest/Unverified:** Show "Verify to Ask" button, opens VerificationModal
2. **Verified+:** Show "Ask Question" button, opens inline composer

**RoleAwareComposer.tsx:**
- For verified users: Single input with AI rewrite + tag suggestions
- For influencer/expert: Additional toggle buttons (Question, Opinion, Carousel, URL Summary)

---

## CHANGE 6: Gamified Profile Enrichment

### Profile Completeness Score

**Database Changes:**
```sql
ALTER TABLE public.profiles
ADD COLUMN profile_completeness_score INTEGER DEFAULT 0;
```

**Scoring Logic (computed on update):**

| Field | Points |
|-------|--------|
| full_name | 10 |
| bio | 5 |
| headline | 10 |
| location | 10 |
| avatar_url | 10 |
| interests (array) | 10 |
| goals (array) | 10 |
| mobile_verified | 20 |
| email_verified (work email) | 15 |
| certifications | 20 |

**Database Trigger:**
```sql
CREATE OR REPLACE FUNCTION public.compute_profile_completeness()
RETURNS trigger AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  IF NEW.full_name IS NOT NULL THEN score := score + 10; END IF;
  IF NEW.bio IS NOT NULL THEN score := score + 5; END IF;
  IF NEW.headline IS NOT NULL THEN score := score + 10; END IF;
  -- ... continue for all fields
  NEW.profile_completeness_score := score;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Frontend Changes:**

**Files to Modify:**
- `src/pages/Profile.tsx`

Add profile completeness ring:
```tsx
<div className="flex items-center gap-4">
  <ProgressRing value={profile.profile_completeness_score} max={100} />
  <div>
    <p className="text-sm font-medium">{profile.profile_completeness_score}% Complete</p>
    <Button variant="link" size="sm">Complete your profile</Button>
  </div>
</div>
```

---

## CHANGE 7: Closed Communities

### Database Schema

```sql
-- Communities table
CREATE TABLE public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  objective TEXT,
  logo_url TEXT,
  is_closed BOOLEAN DEFAULT false,
  creator_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  member_count INTEGER DEFAULT 0
);

-- Community members
CREATE TABLE public.community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- RLS Policies
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- Anyone can view open communities
CREATE POLICY "View open communities" ON public.communities
  FOR SELECT USING (is_closed = false OR id IN (
    SELECT community_id FROM public.community_members WHERE user_id = auth.uid()
  ));

-- Members can view closed communities they belong to
CREATE POLICY "Members can view their communities" ON public.community_members
  FOR SELECT USING (user_id = auth.uid());
```

**Permission Rules:**
- Verified users can create closed communities
- Influencer/Expert can create open OR closed communities
- Oldest member retains admin if creator downgrades

**Frontend Components:**
- `src/components/communities/CreateCommunityModal.tsx`
- `src/components/communities/CommunityCard.tsx`
- `src/pages/Community.tsx`

---

## CHANGE 8: 1-1 + Mass Outreach in Messages

### Database Changes

Add type to conversations:
```sql
ALTER TABLE public.conversations
ADD COLUMN type TEXT DEFAULT 'direct' CHECK (type IN ('direct', 'mass'));
```

Add receiver_id for mass messages:
```sql
ALTER TABLE public.messages
ADD COLUMN receiver_id UUID REFERENCES auth.users(id);
```

### Mass Message Logic

For experts only:
1. Create one conversation per recipient
2. Mark conversation type as 'mass'
3. Display "Mass" badge in Messages list

**API Endpoint (Edge Function):**
```typescript
// POST /messages/mass
// Body: { recipient_ids: string[], body: string }
```

---

## CHANGE 9: Notifications Content

### Notification Type Updates

Current enum: `like | comment | follow | mention | answer | system | live_session | badge`

**Add new types:**
```sql
ALTER TYPE public.notification_type ADD VALUE 'message';
ALTER TYPE public.notification_type ADD VALUE 'community_post';
ALTER TYPE public.notification_type ADD VALUE 'tier_change';
ALTER TYPE public.notification_type ADD VALUE 'fact_check';
ALTER TYPE public.notification_type ADD VALUE 'removal';
```

**Database Triggers for Notifications:**

1. New message notification
2. Mention notification (already exists)
3. Community post notification
4. Tier change notification
5. Post fact-check notification
6. Post removal notification

---

## CHANGE 10: Trending Page + News Ingestion

### Current State
- `news_articles` table exists with category, source, summary, etc.
- `supabase/functions/gemini-article-crawler/` exists for crawling
- Edge functions for fetching financial news exist

### Solution

**News Cron Job:**
Use existing `fetch-financial-news-cron` function, schedule every 15 minutes:
```sql
SELECT cron.schedule(
  'fetch-news-every-15min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url:='https://byipbdumfzuiykkeqezv.supabase.co/functions/v1/gemini-article-crawler',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer ANON_KEY"}'::jsonb
  );
  $$
);
```

**Trending News Endpoint:**
Already available via `gemini-article-crawler` function.

**Frontend:**
Add news section to Markets page or Trending tab in Feed.

---

## CHANGE 11: Markets Page Structure (Moneycontrol Style)

### Current State
Markets page (`src/pages/Markets.tsx`) already has:
- Tabs: India, Global, Forex, Crypto
- Quote cards with prices
- Top gainers/losers

### Enhancement

**New Tab Structure:**
```
Overview | Indian | Global | Commodities | Currencies | Crypto
```

**Overview Tab Content:**
- Top 4 index cards (NIFTY, SENSEX, SPY, NASDAQ)
- Market movers section
- Top 5 gainers/losers
- Latest news headlines from `news_articles`

**Stock Detail Page Tabs:**
```
Overview | Chart | Fundamentals | News | AI Insight
```

**Files to Modify:**
- `src/pages/Markets.tsx`
- `src/pages/StockDetail.tsx`

---

## Implementation Priority

### Phase 1 (Critical Fixes)
1. CHANGE 1: Remove square logo
2. CHANGE 3: Remove Markets duplicate nav
3. CHANGE 2: Fix Messages loading
4. CHANGE 4: Verify Profile loading

### Phase 2 (Mobile UX)
5. CHANGE 0: Mobile spacing optimization

### Phase 3 (Core Features)
6. CHANGE 5: Role-aware composer
7. CHANGE 6: Gamified profiles
8. CHANGE 9: Notification types

### Phase 4 (Communities & Messaging)
9. CHANGE 7: Closed communities
10. CHANGE 8: Mass messaging

### Phase 5 (Content & Markets)
11. CHANGE 10: News ingestion
12. CHANGE 11: Markets restructure

---

## Database Migrations Required

```sql
-- 1. User tier enum
CREATE TYPE public.user_tier AS ENUM ('guest', 'unverified_user', 'verified_user', 'influencer', 'expert');

-- 2. Profile tier fields
ALTER TABLE public.profiles 
ADD COLUMN tier public.user_tier DEFAULT 'unverified_user',
ADD COLUMN streak_days INTEGER DEFAULT 0,
ADD COLUMN upvote_rate DECIMAL DEFAULT 0,
ADD COLUMN mobile_verified BOOLEAN DEFAULT false,
ADD COLUMN linkedin_verified BOOLEAN DEFAULT false,
ADD COLUMN profile_completeness_score INTEGER DEFAULT 0;

-- 3. Communities
CREATE TABLE public.communities (...);
CREATE TABLE public.community_members (...);

-- 4. Conversation type
ALTER TABLE public.conversations ADD COLUMN type TEXT DEFAULT 'direct';

-- 5. Notification types
ALTER TYPE public.notification_type ADD VALUE 'message';
ALTER TYPE public.notification_type ADD VALUE 'community_post';
ALTER TYPE public.notification_type ADD VALUE 'tier_change';
```

---

## Files Summary

### New Files to Create
- `src/hooks/useConversations.ts`
- `src/hooks/useMessages.ts`
- `src/hooks/useUserTier.ts`
- `src/components/auth/VerificationModal.tsx`
- `src/components/create/RoleAwareComposer.tsx`
- `src/components/communities/CreateCommunityModal.tsx`
- `src/components/communities/CommunityCard.tsx`
- `src/pages/Community.tsx`

### Files to Modify
- `src/layouts/MainLayout.tsx`
- `src/components/layout/MobileTopBar.tsx`
- `src/components/layout/MobileBottomNav.tsx`
- `src/pages/Feed.tsx`
- `src/pages/Inbox.tsx`
- `src/pages/Profile.tsx`
- `src/pages/Markets.tsx`
- `src/pages/StockDetail.tsx`
- `src/components/create/CreateHub.tsx`
- `src/stores/uiStore.ts`

---

## Regression Test Checklist

After implementation, verify:
- [ ] Feed loads (all 3 tabs)
- [ ] Posting works
- [ ] Market page loads (single nav only)
- [ ] Profile page loads
- [ ] Messages page loads (with conversations)
- [ ] Notifications page loads
- [ ] Like/Save interactions work
- [ ] Search typeahead works
- [ ] Logout works from Profile
- [ ] Mobile navigation works
- [ ] No square logo visible anywhere
