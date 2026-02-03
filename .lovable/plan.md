
# InvestorPaisa Production Fixes - Comprehensive Plan

## Executive Summary

This plan addresses 10 distinct issues spanning authentication, UI consistency, data integration, and database cleanup. Based on thorough code exploration, I've identified root causes and specific file changes needed.

---

## Issue 1: Google Sign-in Landing on Logged-Out Feed

### Root Cause
The `AuthContext.tsx` correctly handles OAuth callback via `checkOAuthCallback()`, but there's a timing issue. When Google OAuth redirects back with tokens in the URL hash, the `checkOAuthCallback` function clears the hash too early (after only 100ms) before the Supabase client can extract and set the session.

Additionally, the `lovable.auth.signInWithOAuth` function in `src/integrations/lovable/index.ts` needs to ensure session is set properly.

### Solution

**File: `src/contexts/AuthContext.tsx`**
1. Increase the delay after hash detection to allow Supabase to process tokens
2. Add explicit session refresh after OAuth callback detection
3. Force re-fetch of session if hash contained tokens

```
Technical Changes:
- Line 105-113: Enhance checkOAuthCallback to wait longer (500ms) and then force getSession
- Add: After clearing hash, call supabase.auth.getSession() to ensure session is loaded
- Add: If session exists after callback, fetch profile immediately
```

---

## Issue 2: Trending News Cards Missing Action CTAs and Images

### Current State
The `NewsWidget` component in `TrendingStructuredFeed.tsx` only has basic display (title, category, source) and opens external link on click. It's missing:
- Upvote/Downvote CTAs
- Comment count
- Repost functionality
- Save (bookmark) functionality
- Report spam option
- Source images

### Solution

**File: `src/components/feed/TrendingStructuredFeed.tsx`**

Enhance `NewsWidget` to include:
1. Thumbnail/image display (larger and more prominent)
2. Action bar with: Upvote, Downvote, Comment (0), Repost, Save
3. 3-dot menu with: Share, Report spam (which hides the card)
4. When report/hide is clicked, push remaining cards up

```text
NewsWidget Layout:
+----------------------------------------+
| [Image - larger]                       |
| [Category Badge] [Country Badge]       |
| [Title - 2 line clamp]                 |
| [Summary - 2 line clamp]               |
| [Source] • [Time]                      |
| [Upvote] [Down] [Comment] [Repost] [Save] [...] |
+----------------------------------------+
```

Add state management:
- Local state for hidden articles
- Optimistic UI for vote/save actions
- Report modal integration

---

## Issue 3: Edit Profile "Recent Activity" Still Shows "Likes"

### Current State
Looking at `src/pages/Profile.tsx` line 595, the Comments tab still shows:
```typescript
<span>{comment.like_count || 0} likes</span>
```

### Solution

**File: `src/pages/Profile.tsx`**
- Line 595: Change `{comment.like_count || 0} likes` to show upvote icon with count
- Use same pattern as Posts tab (ArrowUp icon + upvote_count)

```typescript
// Before
<span>{comment.like_count || 0} likes</span>

// After
<span className="flex items-center gap-1">
  <ArrowUp className="h-3 w-3" />
  {comment.like_count || 0}
</span>
```

---

## Issue 4: Individual Content Page (PostDetail) Distorted on Mobile

### Current State
Looking at the screenshots:
- Back button is centered above content instead of left-aligned
- Title appears directly below nav without proper spacing
- CTAs are not equidistant on mobile

### Solution

**File: `src/pages/PostDetail.tsx`**
1. Fix Back button alignment - left-aligned, inline with content start
2. Ensure proper mobile padding (px-2 for mobile, px-4 for desktop)
3. Make action CTAs equidistant using `justify-between` on mobile
4. Ensure all content is within the card widget properly

```
Layout Fix:
+------------------------------------------+
| InvestorPaisa        [Search] [Messages] |
+------------------------------------------+
| <- Back                                  |
| +--------------------------------------+ |
| | [Avatar] Name    [Badge]  [...]      | |
| | Title                                | |
| | Body text                            | |
| | [Up] [Down] [Comment] [Repost] [Save]| |
| +--------------------------------------+ |
```

Key CSS changes:
- Back button: `self-start` or `text-left` alignment
- Footer actions: `flex items-center justify-between w-full` for mobile

---

## Issue 5: Remove Hidden Posts for User 'prodmandeep@gmail.com'

### Current State
Database query shows:
```
user_id: b32ab9c1-497a-45d6-80fe-3369b9c55f36
hidden_user_id: b32ab9c1-497a-45d6-80fe-3369b9c55f36
```

The user has hidden their own user ID, which means their own posts are hidden from themselves.

### Solution

**Database Change Required:**
Run delete query to remove the self-hidden record:
```sql
DELETE FROM hidden_users 
WHERE user_id = 'b32ab9c1-497a-45d6-80fe-3369b9c55f36' 
AND hidden_user_id = 'b32ab9c1-497a-45d6-80fe-3369b9c55f36';
```

This should be a one-time database fix via migration.

---

## Issue 6: Indian Indices Data Not Loading

### Current State
The `Markets.tsx` page uses symbols `NIFTY50`, `SENSEX`, `BANKNIFTY`, `NIFTYIT` but these aren't recognized by TwelveData API. TwelveData requires proper exchange symbols.

### Solution

**File: `src/services/market/marketService.ts`** or **`supabase/functions/market-data/index.ts`**

Add symbol mapping for Indian indices:
```typescript
const INDIAN_SYMBOL_MAPPING: Record<string, string> = {
  'NIFTY50': 'NIFTY 50',    // or use ^NSEI for Yahoo Finance
  'SENSEX': 'SENSEX',        // or use ^BSESN
  'BANKNIFTY': 'NIFTY BANK',
  'NIFTYIT': 'NIFTY IT',
};
```

Or use alternative symbols that TwelveData supports:
- For TwelveData: `NIFTY 50`, `SENSEX` (with proper exchange specification)
- Add exchange parameter: `symbol=NIFTY 50&exchange=NSE`

**Alternative approach:** Use a different data source for Indian indices (like NSE official data or a free Indian market API).

---

## Issue 7: Markets Page Empty with Trending News

### Current State
The Markets page doesn't display trending news. The `Markets.tsx` component only shows market data but no news integration.

### Solution

**File: `src/pages/Markets.tsx`**

Add trending news section similar to Feed's Trending tab:
1. Fetch news using `news-trending` edge function with filters
2. Display news widgets below the market data
3. Filter by category: stocks (for Overview/Indian), crypto (for Crypto tab), global

```typescript
// Add to Markets.tsx
const { data: trendingNews } = useQuery({
  queryKey: ['markets-news', activeTab],
  queryFn: async () => {
    const type = activeTab === 'indian' ? 'india' : 
                 activeTab === 'crypto' ? 'crypto' : 
                 activeTab === 'global' ? 'global' : 'all';
    const response = await fetch(
      `${getSupabaseUrl()}/functions/v1/news-trending?type=${type}&limit=10`,
      { headers: { 'Authorization': `Bearer ${getSupabaseAnonKey()}` } }
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.articles || [];
  },
});
```

---

## Issue 8: Search Focus Not Clearing on Click Outside

### Current State
In `MainLayout.tsx`, the search input shows results but when clicking outside:
- The results dropdown closes (via SearchTypeahead's click outside handler)
- But the search query remains and X button stays visible

### Solution

**File: `src/layouts/MainLayout.tsx`**

When SearchTypeahead's `onClose` is called, also clear the search query:
```typescript
{showSearchResults && (
  <SearchTypeahead 
    query={searchQuery} 
    onClose={() => {
      setShowSearchResults(false);
      setSearchQuery('');  // Also clear the query
    }}
    onResultClick={() => {
      setShowSearchResults(false);
      setSearchQuery('');
    }}
  />
)}
```

---

## Issue 9: News Cards Should Appear in Profile (Posts/Saved)

### Clarification Needed
This requires treating news articles as saveable/interactable entities. Currently:
- News articles are external links
- Bookmarks table only tracks `post` entity types

### Solution

Two approaches:

**Approach A (Simpler):** When a user saves a news article, create a special bookmark entry with `entity_type: 'news_article'` and store the news article ID

**Approach B (More complex):** Create internal "news post" entries when users interact with external news

For now, implement Approach A:
1. Add ability to bookmark news articles in `TrendingStructuredFeed.tsx`
2. Update Profile's Saved tab to also fetch news bookmarks
3. Display news articles in Saved tab with appropriate widget

---

## Issue 10: Feed.tsx Using Wrong URL Pattern

### Current State
Line 579 in `Feed.tsx`:
```typescript
`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/news-trending?type=all&limit=20`
```

This uses `import.meta.env.VITE_SUPABASE_URL` directly instead of `getSupabaseUrl()` which has the fallback.

### Solution

**File: `src/pages/Feed.tsx`**
Replace with:
```typescript
import { getSupabaseUrl, getSupabaseAnonKey } from '@/integrations/supabase/client';
// ...
const response = await fetch(
  `${getSupabaseUrl()}/functions/v1/news-trending?type=all&limit=20`,
  { headers: { 'Authorization': `Bearer ${getSupabaseAnonKey()}` } }
);
```

---

## Implementation Order

```text
+------------------------------------------------------------------------+
|  EXECUTION ORDER                                                        |
+------------------------------------------------------------------------+
|  1. Database Fix: Remove self-hidden user record                        |
|     - One-time migration to fix prodmandeep's hidden posts              |
|                                                                         |
|  2. Auth Fix: Google OAuth session handling                             |
|     - Update AuthContext.tsx timing for OAuth callback                  |
|                                                                         |
|  3. Search Focus Fix                                                   |
|     - Update MainLayout.tsx to clear query on close                     |
|                                                                         |
|  4. Profile.tsx: Fix "likes" label                                     |
|     - Change to upvote pattern                                          |
|                                                                         |
|  5. PostDetail.tsx: Mobile layout fixes                                |
|     - Back button alignment, equidistant CTAs                           |
|                                                                         |
|  6. Feed.tsx: Fix URL pattern                                          |
|     - Use getSupabaseUrl() instead of import.meta.env                   |
|                                                                         |
|  7. TrendingStructuredFeed.tsx: Add action CTAs to news                |
|     - Upvote, downvote, comment, repost, save, report                   |
|                                                                         |
|  8. Markets.tsx: Add trending news section                             |
|     - Integrate news fetching with category filters                     |
|                                                                         |
|  9. Market Data: Fix Indian indices                                    |
|     - Add proper symbol mapping for NSE indices                         |
+------------------------------------------------------------------------+
```

---

## Files Summary

| Issue | Files Modified |
|-------|----------------|
| 1. Google Auth | AuthContext.tsx |
| 2. News CTAs | TrendingStructuredFeed.tsx |
| 3. Profile likes | Profile.tsx |
| 4. Mobile PostDetail | PostDetail.tsx |
| 5. Hidden posts | Database migration |
| 6. Indian indices | market-data/index.ts or marketService.ts |
| 7. Markets news | Markets.tsx |
| 8. Search focus | MainLayout.tsx |
| 9. News in profile | TrendingStructuredFeed.tsx, Profile.tsx |
| 10. Feed URL | Feed.tsx |

---

## Testing Checklist

- [ ] Sign in with Google -> Lands on /feed with user session active
- [ ] Trending tab shows news with images and action CTAs (up/down/comment/repost/save)
- [ ] Report spam on news article -> Article hides, cards shift up
- [ ] Edit Profile Recent Activity shows upvotes not likes
- [ ] PostDetail page on mobile: Back button left-aligned, CTAs equidistant
- [ ] User prodmandeep@gmail.com sees their own posts in Pulse
- [ ] Markets page shows Indian indices data (NIFTY50, SENSEX)
- [ ] Markets page shows trending news by category
- [ ] Click outside search -> Query clears, X button removed
- [ ] Trending news properly fetches and displays in Feed

---

## Technical Notes

### Google OAuth Session Timing
The issue is that `window.history.replaceState` clears the hash before Supabase's internal listener can capture the tokens. The fix involves:
1. Waiting longer before clearing (500ms instead of 100ms)
2. Manually calling `getSession()` after hash processing
3. Ensuring `onAuthStateChange` callback processes the new session

### Indian Market Data
TwelveData's free tier has limited Indian market support. Options:
1. Use TwelveData's proper index symbols with exchange parameter
2. Integrate with NSE's official data (may require different API)
3. Use mock data as fallback when real data unavailable

### News Article Interactions
To allow users to save/interact with news articles:
- Store interactions in bookmarks table with `entity_type: 'news_article'`
- News article ID from `news_articles` table serves as `entity_id`
- Profile page needs to join bookmarks with news_articles for display
