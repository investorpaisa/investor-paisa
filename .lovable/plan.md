
# Implementation Plan: Remaining Phases (Phase 10-18)

## Current State Analysis

Based on my exploration, the following has been **already implemented**:

### Completed Features:
1. **AuthGateModal** - Reusable auth gate component (src/components/auth/AuthGateModal.tsx)
2. **Landing page** - With search, sticky CTA, Pulse/Trending tabs
3. **LandingFeedPreview** - Username-only display, tab navigation, interaction gating
4. **Search functionality** - useSearch hook + SearchTypeahead with real API calls
5. **Upvote/Downvote system** - In Feed.tsx with optimistic UI
6. **Repost system** - Database table + useReposts hook
7. **Profile menu** - 3-dot menu with Edit/Logout in Profile.tsx
8. **Analytics events** - trackEvents object in googleAnalytics.ts
9. **Error states** - error-state.tsx component
10. **News ingestion** - fetch-newsapi-articles edge function + news-trending API
11. **CreateHub** - Full create flow with Question/Opinion/Community/Brand Collab

### Remaining Features to Implement:

---

## Phase 10: LinkedIn OAuth Connection

### 10.1 Database Migration
Add `linkedin_id` column to profiles (already added in previous migration)

### 10.2 Create LinkedIn Edge Function
**New File:** `supabase/functions/auth-linkedin-connect/index.ts`

OAuth flow implementation:
- Handle authorization redirect
- Exchange code for access token
- Fetch LinkedIn profile
- Update profiles.linkedin_id

### 10.3 Update Edit Profile UI
Add "Connect LinkedIn" button in ProfileEditForm that:
- Initiates OAuth redirect
- Shows verified status when connected

---

## Phase 11: Mobile OTP Verification

### 11.1 Create Mobile OTP Edge Functions
**New Files:**
- `supabase/functions/auth-mobile-request-otp/index.ts`
- `supabase/functions/auth-mobile-verify-otp/index.ts`

Implementation approach:
- Use Supabase Auth phone provider or store OTP in temp table
- Generate 6-digit OTP, send via SMS gateway (configurable)
- Verify and set mobile_verified = true

### 11.2 Update ProfileEditForm
Add mobile verification UI:
- Mobile input field
- "Verify" button opens OTP modal
- Show verified badge when complete

---

## Phase 13: Expert Mass Messaging

### 13.1 Create Mass Message Edge Function
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

Creates individual messages with "Expert Broadcast" badge

### 13.2 Update Inbox UI
Add "Mass Broadcast" button for experts
Mark broadcast messages with special badge

---

## Phase 14: Communities Following Feed

### 14.1 Update Feed Query
Modify Following tab in Feed.tsx to include:
- Posts from followed users
- Posts from communities user is member of

Query logic:
```typescript
// Get community IDs user is member of
const { data: memberships } = await supabase
  .from('community_members')
  .select('community_id')
  .eq('user_id', user.id);

// Include posts from those communities
query = query.or(`author_id.in.(${followingIds}),community_id.in.(${communityIds})`);
```

---

## Phase 15: Create Flow Enhancement

CreateHub already has the options implemented. Minor updates:
- Ensure community creation works with database
- Add success navigation

---

## Phase 16: Trending Page Structure

### 16.1 Create Database Tables
**Migration:**
```sql
-- Promotions table for promoted profiles
CREATE TABLE IF NOT EXISTS public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('profile', 'service')),
  entity_id uuid NOT NULL,
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true,
  starts_at timestamptz DEFAULT now(),
  ends_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Promotions viewable by all" ON public.promotions FOR SELECT USING (true);

-- Services table for paid services listings
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  price numeric,
  category text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Services viewable by all" ON public.services FOR SELECT USING (true);
CREATE POLICY "Users manage own services" ON public.services FOR ALL USING (auth.uid() = provider_id);
```

### 16.2 Create Promotions Edge Function
**New File:** `supabase/functions/promotions-profiles/index.ts`

Returns promoted profiles for feed insertion

### 16.3 Create Leaderboard Edge Function
**New File:** `supabase/functions/leaderboard-influencers/index.ts`

Returns top 10 influencers by follower count

### 16.4 Update Trending Tab in Feed
Structure:
1. News Widgets 1-4
2. Promoted Profile Card
3. News Widgets 5-8
4. Paid Services Card
5. Influencer Leaderboard
6. Repeat pattern

---

## Phase 17: Analytics Events (Complete)

Already implemented in googleAnalytics.ts with trackEvents object.

Wiring needed:
- Ensure all actions call appropriate trackEvents method
- Add missing event calls in components

---

## Phase 18: Error States (Complete)

error-state.tsx already created. Apply to remaining components:
- Ensure Feed, Profile, Messages, Notifications use ErrorState
- Add retry functionality

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/auth-linkedin-connect/index.ts` | LinkedIn OAuth flow |
| `supabase/functions/auth-mobile-request-otp/index.ts` | Mobile OTP request |
| `supabase/functions/auth-mobile-verify-otp/index.ts` | Mobile OTP verification |
| `supabase/functions/messages-mass/index.ts` | Expert mass messaging |
| `supabase/functions/promotions-profiles/index.ts` | Promoted profiles API |
| `supabase/functions/leaderboard-influencers/index.ts` | Influencer leaderboard |
| `src/components/profile/MobileVerificationModal.tsx` | Mobile OTP verification UI |
| `src/components/profile/LinkedInConnect.tsx` | LinkedIn connect button |
| `src/components/feed/TrendingStructuredFeed.tsx` | Structured trending layout |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/profile/ProfileEditForm.tsx` | Add LinkedIn/Mobile verification UI |
| `src/pages/Feed.tsx` | Update Following query for communities, add structured trending |
| `src/pages/Inbox.tsx` | Add expert broadcast UI |
| `supabase/config.toml` | Add new function configurations |

## Database Migrations

```sql
-- 1. Promotions table
CREATE TABLE IF NOT EXISTS public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('profile', 'service')),
  entity_id uuid NOT NULL,
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true,
  starts_at timestamptz DEFAULT now(),
  ends_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 2. Services table
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  price numeric,
  category text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Promotions viewable" ON public.promotions FOR SELECT USING (true);
CREATE POLICY "Services viewable" ON public.services FOR SELECT USING (true);
CREATE POLICY "Users manage services" ON public.services FOR ALL USING (auth.uid() = provider_id);
```

---

## Implementation Order

1. **Database Migration** - Create promotions and services tables
2. **Phase 10** - LinkedIn OAuth connection
3. **Phase 11** - Mobile OTP verification
4. **Phase 13** - Expert mass messaging
5. **Phase 14** - Communities in Following feed
6. **Phase 16** - Trending page structure with promotions/leaderboard
7. **Wiring** - Ensure all analytics events are properly called
8. **Testing** - Verify all flows work correctly

---

## Technical Notes

### LinkedIn OAuth Flow
1. Redirect to `https://www.linkedin.com/oauth/v2/authorization`
2. User authorizes
3. LinkedIn redirects to callback with code
4. Exchange code for access token
5. Fetch `/v2/me` profile
6. Store linkedin_id in profiles

### Mobile OTP Flow
1. User enters phone number
2. Generate 6-digit OTP, store with expiry
3. Send via SMS gateway (Twilio/MSG91)
4. User enters OTP
5. Verify and set mobile_verified = true

### Trending Feed Structure
Pattern repeats every 12 items:
- Items 1-4: News articles
- Item 5: Promoted profile
- Items 6-9: News articles
- Item 10: Service listing
- Item 11: Leaderboard preview
- Item 12: Spacer

---

## Secrets Required

| Secret | Purpose |
|--------|---------|
| `LINKEDIN_CLIENT_ID` | LinkedIn OAuth |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth |
| `SMS_GATEWAY_API_KEY` | Mobile OTP (Twilio/MSG91) |

Note: NEWSAPI_AI_KEY already configured

---

## Regression Checklist

After implementation, verify:
- [ ] Landing loads with search and tabs
- [ ] Auth gate appears on all interactions
- [ ] Upvote/Downvote works with optimistic UI
- [ ] Repost toggle works
- [ ] Profile menu shows Edit/Logout
- [ ] LinkedIn connect flow works
- [ ] Mobile OTP verification works
- [ ] Expert can send mass messages
- [ ] Following tab includes community posts
- [ ] Trending shows structured layout with news/promotions
- [ ] Leaderboard displays top 10 influencers
- [ ] All analytics events fire correctly
