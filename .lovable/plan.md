

# Comprehensive QA Audit & User Onboarding Fix Plan

## Executive Summary

After thorough analysis of the InvestorPaisa codebase and platform, I've identified **critical blocking issues** that are preventing user onboarding and causing the platform to appear "bare". This plan addresses all three categories of issues reported.

---

## Audit Findings Summary

### Critical Finding #1: Edge Functions Not Deployed

**Root Cause:** The following edge functions exist in the codebase but return 404 errors when called - they are NOT deployed to the Supabase backend:

| Function | Purpose | Status |
|----------|---------|--------|
| `news-trending` | Trending news feed | NOT DEPLOYED |
| `market-data` | Stock/Crypto quotes | NOT DEPLOYED |
| `promotions-profiles` | Featured experts | NOT DEPLOYED |
| `leaderboard-influencers` | Top influencers | NOT DEPLOYED |
| `auth-mobile-request-otp` | Mobile OTP sending | NOT DEPLOYED |
| `auth-mobile-verify-otp` | OTP verification | NOT DEPLOYED |

**Impact:** 
- Landing page shows empty feed preview
- Markets page shows no data
- Trending feed is empty
- Mobile verification completely broken
- Cannot test comment/message/post/create workflows

### Critical Finding #2: Missing SMS Gateway Configuration

**Root Cause:** The `auth-mobile-request-otp` function checks for `ACCOUNT_SID` and `AUTH_TOKEN` environment variables which is NOT configured in secrets.

**Current Secrets:**
- FINNHUB_API_KEY
- LOVABLE_API_KEY
- NEWSAPI_AI_KEY
- PERPLEXITY_API_KEY
- TWELVEDATA_API_KEY

**Missing:** `ACCOUNT_SID` and `AUTH_TOKEN` (for Twilio)

**Impact:** Even if edge function is deployed, SMS messages cannot be sent.

### Critical Finding #3: No Approved Posts in Database

**Evidence:** Query `SELECT COUNT(*) FROM posts WHERE moderation_status = 'approved' AND deleted_at IS NULL` returns `0`.

**Impact:** 
- Pulse tab shows "No posts yet"
- LandingFeedPreview shows empty state
- Following tab has nothing to show

### Critical Finding #4: Session Refresh Causing Page Reload Issues

**Root Cause Analysis:**
1. `SessionContext` tracks activity with `mousedown`, `mousemove`, `keypress`, `scroll`, `touchstart`, `click` events
2. Each event triggers `updateActivity()` which writes to `localStorage`
3. The `AuthContext` relies on Supabase's `onAuthStateChange` listener
4. When navigating between Profile/Alerts/Messages, multiple query invalidations occur
5. React Query's cache invalidation combined with auth state changes causes component unmounts

**Evidence in Code:**
```typescript
// SessionContext.tsx - Activity listeners fire on every interaction
activityEvents.forEach(event => {
  document.addEventListener(event, handleActivity, true);
});
```

**Impact:** Pages like Profile, Inbox, Notifications may appear to "not load again" after certain interactions due to state synchronization issues.

### Critical Finding #5: News Articles Are Being Fetched But Not Displayed

**Evidence:** News articles ARE in the database (query shows 10+ recent articles), but the `news-trending` edge function is not deployed, so the Feed's `TrendingStructuredFeed` component shows nothing.

### UI/UX Finding #6: Landing Page Start Button Too Large

**Current Button Code:**
```typescript
<Button 
  size="lg" 
  onClick={handleStartCTA}
  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6 h-auto rounded-2xl glow-primary font-semibold"
>
```
The `py-6` and `h-auto` make the button disproportionately tall.

---

## Phase 1: Deploy All Edge Functions (CRITICAL)

### 1.1 Deploy Core Edge Functions

Deploy the following functions immediately:
1. `news-trending`
2. `market-data`
3. `market-ai`
4. `promotions-profiles`
5. `leaderboard-influencers`
6. `auth-mobile-request-otp`
7. `auth-mobile-verify-otp`
8. `search`
9. `fetch-newsapi-articles`

### 1.2 Verify CORS Headers

All functions already have appropriate CORS headers. Verify deployment success by testing each endpoint.

**Test Commands:**
```
GET /news-trending?type=all&limit=5
GET /market-data?endpoint=health
GET /leaderboard-influencers?limit=5
GET /promotions-profiles?type=profile&limit=3
```

---

## Phase 2: Configure SMS Gateway for OTP Verification

### 2.1 Add SMS Gateway Secret

Add `ACCOUNT_SID` and `AUTH_TOKEN` secret for Twilio. (ACCOUNT SID: AC82cd1e591ff9ec7f163d66f6a005ab9e; AUTH_TOKEN: cae15913d3f7e8e28806c30d76b7a5aa)

### 2.2 Alternative: Development Mode OTP

If SMS is not immediately available, implement a development fallback that:
- Stores OTP in database (already implemented)
- Returns OTP in a development toast for testing
- Add clear warning this is for testing only

### 2.3 OTP Flow Verification

After deployment, test the complete flow:
1. Enter phone number with +91 prefix
2. Request OTP via edge function
3. Verify OTP matches stored value
4. Profile `mobile_verified` flag updates

---

## Phase 3: Seed Content for Landing Experience

### 3.1 Create Sample Approved Posts

Insert 10-15 seed posts with realistic finance questions:
- Questions about investing, mutual funds, stocks
- Mix of question types
- Set `moderation_status = 'approved'`

### 3.2 Create Test User Accounts

As specified in original requirements:

| Email | Type | mobile_verified | tier |
|-------|------|-----------------|------|
| uv1@investorpaisa.com | Unverified | false | user |
| uv2@investorpaisa.com | Unverified | false | user |
| v1@investorpaisa.com | Verified | true | user |
| v2@investorpaisa.com | Verified | true | user |
| inf1@investorpaisa.com | Influencer | true | influencer |
| inf2@investorpaisa.com | Influencer | true | influencer |
| exp1@investorpaisa.com | Expert | true | expert |
| exp2@investorpaisa.com | Expert | true | expert |

---

## Phase 4: Fix Session/State Management Issues

### 4.1 Optimize SessionContext Activity Tracking

**Problem:** Activity listeners fire too frequently, causing excessive localStorage writes.

**Solution:** Debounce the `updateActivity` function:

```typescript
// Add debounce utility
const debouncedUpdateActivity = useCallback(
  debounce(() => {
    const now = new Date();
    setLastActivity(now);
    localStorage.setItem('last_activity', now.toISOString());
  }, 1000), // Only update once per second max
  []
);
```

### 4.2 Prevent Unnecessary Re-renders on Navigation

**Problem:** Query invalidations on page transitions cause flickering.

**Solution:** Add proper `staleTime` to critical queries and use `keepPreviousData`:

```typescript
const { data: profile } = useQuery({
  queryKey: ['profile', profileId],
  queryFn: async () => { ... },
  staleTime: 60000, // 1 minute
  keepPreviousData: true,
});
```

### 4.3 Stabilize Auth State Transitions

**Problem:** `onAuthStateChange` can fire multiple times during token refresh.

**Solution:** Add a debounced wrapper around the auth state handler:

```typescript
let authChangeTimeout: NodeJS.Timeout;
const debouncedAuthChange = (event, session) => {
  clearTimeout(authChangeTimeout);
  authChangeTimeout = setTimeout(() => {
    // Handle auth change
  }, 100);
};
```

---

## Phase 5: UI/UX Fixes for Landing Page

### 5.1 Reduce Start Button Size

**Before:**
```typescript
className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6 h-auto rounded-2xl glow-primary font-semibold"
```

**After:**
```typescript
className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-base py-3 h-12 rounded-2xl glow-primary font-semibold"
```

Changes:
- `text-lg` → `text-base`
- `py-6` → `py-3`
- Add explicit `h-12`

### 5.2 Add Loading States for Empty Content

When no posts exist, show a more engaging empty state:

```typescript
<div className="text-center py-12 text-muted-foreground">
  <Sparkles className="h-10 w-10 mx-auto mb-4 text-primary/50" />
  <p className="font-medium">Be the first to ask!</p>
  <p className="text-sm mt-1">Start a conversation about money</p>
</div>
```

### 5.3 Ensure Design Consistency

Review all components for:
- Teal/Cyan primary color (#0ABAB5)
- No violet/purple colors
- Consistent glass morphism on cards
- Proper rounded corners (rounded-2xl)

---

## Phase 6: Market Data Integration Verification

### 6.1 Deploy Market Edge Functions

Deploy `market-data` and `market-ai` functions.

### 6.2 Verify API Keys

Confirm TwelveData and Finnhub API keys are valid:
- `TWELVEDATA_API_KEY` - confirmed present
- `FINNHUB_API_KEY` - confirmed present

### 6.3 Test Hybrid Fallback

The market-data function already implements provider failover:
1. Try TwelveData first
2. Fallback to Finnhub
3. Return cached/stale data if both fail

Verify this works after deployment.

---

## Implementation Order

### Step 1 (Immediate): Deploy Edge Functions
Deploy all 9+ edge functions to make the platform functional.

### Step 2 (Same Session): Seed Content
Create sample posts and test users so the landing page has content.

### Step 3: Configure SMS or Dev Mode
Either add SMS_GATEWAY_API_KEY or implement dev mode OTP for testing.

### Step 4: Session State Fixes
Apply debouncing and stabilization fixes to prevent refresh issues.

### Step 5: UI Refinements
Reduce Start button size and ensure design consistency.

### Step 6: Full QA Pass
Test all workflows end-to-end:
- Sign up → Verify email → Login
- Mobile OTP verification
- Create post → View in feed
- Comment/Like/Share interactions
- Profile edit → Save → Persist
- Markets page data loading
- Messages/Notifications

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/contexts/SessionContext.tsx` | Add debounce to activity tracking |
| `src/contexts/AuthContext.tsx` | Debounce auth state changes |
| `src/pages/Landing.tsx` | Reduce Start button size |
| `src/components/landing/LandingFeedPreview.tsx` | Better empty state |
| `src/hooks/useNotifications.ts` | Add staleTime/keepPreviousData |
| `src/hooks/useConversations.ts` | Add staleTime/keepPreviousData |

**New Secrets to Add:**
- `SMS_GATEWAY_API_KEY` (for MSG91 or similar)

**Edge Functions to Deploy:**
All 25 functions in `supabase/functions/`

**Database Seed Data:**
- 10-15 sample posts
- 8 test user accounts

---

## Success Criteria

After implementation:
1. Landing page shows feed content (posts or news)
2. Start button is appropriately sized
3. Mobile OTP verification works end-to-end
4. Markets page shows stock/crypto data
5. Profile/Inbox/Notifications don't cause page reload issues
6. All test accounts can be used for QA
7. Session persists correctly across page transitions

---

## Risk Mitigation

### If SMS Gateway Not Available
Implement temporary dev mode that:
- Shows OTP in toast notification
- Logs "DEV MODE" warning
- Auto-fills OTP input for testing

### If API Rate Limits Hit
Market data already has caching. News data should add caching layer in edge function.

### If Edge Functions Fail to Deploy
Check function syntax, ensure proper Deno imports, verify CORS headers are complete.

