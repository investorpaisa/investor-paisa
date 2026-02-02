
# InvestorPaisa Production Readiness - Implementation Plan

## Executive Summary

This plan addresses 9 specific production issues in strict execution order. Each fix includes root cause analysis, implementation details, and verification criteria.

---

## Issue 1: Mobile OTP Broken (Modal Loop)

### Root Cause Analysis (RCA)
**Critical Finding from Console Logs**:
```
[OTP UI] Request error: SyntaxError: Failed to execute 'json' on 'Response': 
Unexpected token '<', "<!DOCTYPE " is not valid JSON
```

**Root Cause**: The edge function is returning HTML (likely a 404 or error page) instead of JSON. This happens when:
1. The edge function is not deployed
2. The function URL is incorrect
3. CORS preflight is returning HTML

**Secondary Issue**: The `MobileVerificationModal` component auto-requests OTP when `initialPhone` is provided, which can cause the modal loop if the request fails immediately.

### Technical Solution

#### A. Deploy Edge Functions
Ensure `auth-mobile-request-otp` and `auth-mobile-verify-otp` are properly deployed.

#### B. Fix Modal State Machine
Update `src/components/profile/MobileVerificationModal.tsx` to:
1. Remove auto-OTP request on modal open (causing the loop)
2. Only request OTP on explicit user action
3. Add proper error handling for non-JSON responses
4. Implement state machine: `idle -> sending -> sent -> verifying -> success`

#### C. Add Response Validation
```typescript
const response = await fetch(...);
const contentType = response.headers.get('content-type');
if (!contentType || !contentType.includes('application/json')) {
  throw new Error('Server returned invalid response');
}
const data = await response.json();
```

### Files Modified
- `src/components/profile/MobileVerificationModal.tsx`
- Deploy `supabase/functions/auth-mobile-request-otp/index.ts`
- Deploy `supabase/functions/auth-mobile-verify-otp/index.ts`

---

## Issue 2: Connect LinkedIn Broken

### Root Cause Analysis (RCA)
**Same Issue as Mobile OTP**:
```
LinkedIn connect error: SyntaxError: Unexpected token '<', "<!DOCTYPE " is not valid JSON
```

The edge function is not responding with JSON, indicating deployment or CORS issues.

### Technical Solution

#### A. Deploy Edge Function
Ensure `auth-linkedin-connect` is deployed and accessible.

#### B. Fix LinkedInConnect Component
Update `src/components/profile/LinkedInConnect.tsx`:
1. Add response content-type validation before parsing JSON
2. Add better error messaging for deployment issues

#### C. Verify LinkedIn Developer Console
Ensure redirect URI matches exactly:
- Production: `https://investorpaisa.com/profile/edit`
- Preview: `https://id-preview--14ca1bc6-3a3e-4389-94f1-5fe01fd1bbce.lovable.app/profile/edit`

### Files Modified
- `src/components/profile/LinkedInConnect.tsx`
- Deploy `supabase/functions/auth-linkedin-connect/index.ts`

---

## Issue 3: Trending News Integration via Google RSS

### Current State
- Existing `news-trending` edge function fetches from `news_articles` table
- News is ingested via `fetch-newsapi-articles` and `gemini-article-crawler`

### Technical Solution

#### A. Create New Edge Function: `fetch-google-rss`
New file: `supabase/functions/fetch-google-rss/index.ts`

RSS Feed URLs to fetch:
- **Indian (50 articles)**:
  - Indian Stock Market (20): `https://news.google.com/rss/search?q=indian+stock+market&hl=en-IN`
  - Indian Economy (10): `https://news.google.com/rss/search?q=indian+economy&hl=en-IN`
  - Non-Indian Commodities (20): `https://news.google.com/rss/search?q=commodities+gold+oil&hl=en`

- **Non-India (50 articles)**:
  - Global Stock Market (20): `https://news.google.com/rss/search?q=global+stock+market&hl=en`
  - Global Economy (10): `https://news.google.com/rss/search?q=world+economy&hl=en`
  - Global Commodities (20): `https://news.google.com/rss/search?q=gold+oil+commodities&hl=en`

#### B. Update Database Table
The existing `news_articles` table already has:
- `title`, `description`, `source`, `url`, `image_url`
- `category`, `country`, `published_at`

Add a simple country/region tagging:
- `region: 'india' | 'global'`

#### C. Create Cron Job (Every 5 Minutes)
```sql
select cron.schedule(
  'fetch-google-rss-news',
  '*/5 * * * *',
  $$
  select net.http_post(
    url:='https://mgjxxihralfncarbuvqs.supabase.co/functions/v1/fetch-google-rss',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);
```

#### D. Update Trending API
Modify `supabase/functions/news-trending/index.ts` to:
- Accept `region` parameter (india, global)
- Accept `category` parameter
- Return last 24h only

### Files Created/Modified
- `supabase/functions/fetch-google-rss/index.ts` (new)
- `supabase/functions/news-trending/index.ts` (update)
- Cron job SQL

---

## Issue 4: Markets Data Not Flowing

### Root Cause Analysis (RCA)
**Evidence**: The `market-data` edge function exists and is well-structured with:
- TwelveData as primary provider
- Finnhub as fallback
- Proper caching layer

**Secrets Check**: Both `TWELVEDATA_API_KEY` and `FINNHUB_API_KEY` are configured.

**Potential Issues**:
1. Edge function not deployed
2. API rate limits exceeded
3. Symbol format mismatch (e.g., NIFTY50 vs ^NSEI)

### Technical Solution

#### A. Deploy Edge Function
Ensure `market-data` function is deployed.

#### B. Fix Symbol Mapping
Indian indices need proper symbol mapping:
- NIFTY50 -> `NIFTY50.NS` or `^NSEI` for TwelveData
- SENSEX -> `SENSEX.BO` or `^BSESN`

Update `supabase/functions/market-data/index.ts` with symbol normalization.

#### C. Add Mock Data Fallback
For development/testing, return mock data if both providers fail.

### Files Modified
- `supabase/functions/market-data/index.ts`
- Deploy function

---

# Issue 5: Search - Public Profile Access

### Current State
- No `/u/:username` route exists
- Profile page exists at `/profile/:userId`
- No "View Public Profile" option in 3-dot menu

### Technical Solution

#### A. Add Public Profile Route
Update `src/App.tsx`:
```typescript
<Route path="/u/:username" element={
  <MainLayout>
    <PublicProfile />
  </MainLayout>
} />
```

#### B. Create PublicProfile Component
New file: `src/pages/PublicProfile.tsx`
- Fetches profile by username from `profiles_public` view
- Shows: Username, Bio, Posts
- No private data (email, phone)
- If viewing own profile, show banner: "You are viewing your public profile"

#### C. Update Profile 3-dot Menu
Update `src/pages/Profile.tsx` dropdown:
```typescript
<DropdownMenuItem onClick={() => navigate(`/u/${profile.username}`)}>
  View Public Profile
</DropdownMenuItem>
```

#### D. Update Search Results
Update search to navigate to `/u/:username` for user results.

### Files Created/Modified
- `src/pages/PublicProfile.tsx` (new)
- `src/App.tsx`
- `src/pages/Profile.tsx`
- `src/hooks/useSearch.ts` (if needed)

---

## Issue 6: Landing Page Revamp (CRED-like)

### Current State
The landing page (`src/pages/Landing.tsx`) already has:
- Premium dark theme
- Animated gradients
- Search functionality
- LandingFeedPreview component
- Sticky "Start" CTA button

### Technical Solution

#### A. Enhance Hero Section
Add animated value props with staggered fade-in:
```typescript
const valueProp = [
  "Ask investment questions",
  "Get expert answers",
  "Join financial communities"
];
```

#### B. Add Auto-scrolling Cards
Create `src/components/landing/AutoScrollCards.tsx`:
- Horizontal scroll of featured posts/testimonials
- CSS animation for infinite scroll

#### C. Add Community Proof Section
Show stats: "10K+ investors", "1000+ questions answered"

#### D. Enhance Animations
- Parallax scroll effect on background gradients
- Card hover lift (3D transform)
- Smooth fade + translateY transitions

#### E. Ensure Logout Redirects Here
Verify `handleLogout` in Profile.tsx navigates to `/`:
```typescript
await supabase.auth.signOut();
navigate('/', { replace: true });
```

### Files Modified
- `src/pages/Landing.tsx`
- `src/components/landing/HeroSection.tsx` (if exists)
- Create `src/components/landing/AutoScrollCards.tsx`
- Create `src/components/landing/CommunityProof.tsx`

---

## Issue 7: Remove "Hide Own Content" Option

### Current State
The 3-dot menu in `src/pages/Feed.tsx` (FeedPostCard) shows "Hide posts from this user" for all posts, including own posts.

### Technical Solution

#### Update FeedPostCard Dropdown
```typescript
{/* Only show Hide User option for OTHER users' posts */}
{post.author_id !== user?.id && (
  <DropdownMenuItem onClick={handleHideUser}>
    <EyeOff className="mr-2 h-4 w-4" />
    Hide posts from this user
  </DropdownMenuItem>
)}
```

Keep these options for all posts:
- Share
- Copy link
- Report content (only for other's posts)

### Files Modified
- `src/pages/Feed.tsx` (FeedPostCard component)
- `src/components/posts/PostCard.tsx` (if applicable)

---

## Implementation Order

```text
+------------------------------------------------------------------------+
|  EXECUTION ORDER (STRICT)                                              |
+------------------------------------------------------------------------+
|  1. Google Sign-in                                                     |
|     -> Already working, verify deployment                              |
|                                                                         |
|  2. Mobile OTP Fix                                                     |
|     -> Deploy edge functions                                            |
|     -> Fix modal state machine                                          |
|     -> Add response validation                                          |
|                                                                         |
|  3. LinkedIn Connect Fix                                               |
|     -> Deploy edge function                                             |
|     -> Add response validation                                          |
|     -> Verify redirect URI                                              |
|                                                                         |
|  4. Trending News (Google RSS)                                         |
|     -> Create fetch-google-rss edge function                            |
|     -> Set up cron job                                                  |
|     -> Update news-trending API                                         |
|                                                                         |
|  5. Markets Data Fix                                                   |
|     -> Deploy market-data function                                      |
|     -> Fix symbol mapping                                               |
|     -> Add fallback mock data                                           |
|                                                                         |
|  6. Logged-out Feed Behavior                                           |
|     -> Limit to 2 tabs (Pulse, Trending)                               |
|     -> Update bottom nav (Home, Create, Markets)                        |
|     -> Create tap opens auth modal                                      |
|                                                                         |
|  7. Search → Public Profile                                            |
|     -> Add /u/:username route                                           |
|     -> Create PublicProfile page                                        |
|     -> Add 3-dot menu options                                           |
|                                                                         |
|  8. Landing Page Revamp                                                |
|     -> Add animated value props                                         |
|     -> Add auto-scrolling cards                                         |
|     -> Add community proof                                              |
|     -> Ensure logout redirects here                                     |
|                                                                         |
|  9. Remove Hide Own Content                                            |
|     -> Conditional dropdown item based on author                        |
+------------------------------------------------------------------------+
```

---

## Files Summary

| Issue | New Files | Modified Files |
|-------|-----------|----------------|
| 1. Google | - | Verify deployment only |
| 2. Mobile OTP | - | `MobileVerificationModal.tsx`, deploy functions |
| 3. LinkedIn | - | `LinkedInConnect.tsx`, deploy function |
| 4. Trending | `fetch-google-rss/index.ts` | `news-trending/index.ts`, cron SQL |
| 5. Markets | - | `market-data/index.ts`, deploy |
| 6. Logged-out | - | `Feed.tsx`, `MobileBottomNav.tsx`, `RoleAwareCreateButton.tsx` |
| 7. Public Profile | `PublicProfile.tsx` | `App.tsx`, `Profile.tsx` |
| 8. Landing | `AutoScrollCards.tsx`, `CommunityProof.tsx` | `Landing.tsx` |
| 9. Hide Own | - | `Feed.tsx`, `PostCard.tsx` |

---

## QA Acceptance Checklist

- [ ] Google sign-in creates session and redirects to feed
- [ ] Email OTP completes without extra email link
- [ ] Mobile OTP: modal stays open, OTP verifies, profile updates
- [ ] LinkedIn: OAuth popup opens, returns with "Connected" status
- [ ] Trending tab shows fresh news from last 24h
- [ ] Markets page shows real-time data with no empty states
- [ ] Logged-out feed shows only Pulse and Trending tabs
- [ ] Logged-out bottom nav shows only Home, Create, Markets
- [ ] Create tap (logged-out) opens sign-in modal
- [ ] Search user result navigates to `/u/:username`
- [ ] Profile 3-dot shows "Edit Profile", "Public Profile", "Log Out"
- [ ] Landing page has CRED-like premium aesthetics
- [ ] Logout redirects to landing page
- [ ] Own posts don't show "Hide posts from this user" option

---

## Hard Stop Constraints (DO NOT MODIFY)

- Feed ranking logic
- AI logic
- Permissions model
- Existing logged-in navigation structure
- Database schemas (except news/RSS changes)
- Styling tokens

---

## Critical Deployment Note

The console errors show edge functions are returning HTML instead of JSON. This indicates **functions are not deployed**. The first step in implementation must be:

```bash
# Deploy all auth-related edge functions
supabase functions deploy auth-mobile-request-otp
supabase functions deploy auth-mobile-verify-otp
supabase functions deploy auth-linkedin-connect
supabase functions deploy market-data
```

Or use the Lovable deploy tool to trigger deployment of these functions.
