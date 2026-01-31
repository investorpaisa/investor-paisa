
# Surgical Platform Changes Implementation Plan

## Executive Summary
This plan implements 12 surgical changes to the InvestorPaisa platform, focusing on:
- Removing Live Sessions module
- Replacing "Learn" tab with "Trending" 
- Updating navigation icons and removing Discover page
- Implementing instant search typeahead
- Mobile-first navigation transformation
- Removing Pi Chat UI (keeping AI backend)
- Moving logout to Profile page
- Logo/branding updates with new assets
- Social sharing and auth gate improvements
- Market data and profile page fixes
- Mobile UI consistency pass

---

## CHANGE 1: DELETE LIVE SESSION MODULE

### Frontend Deletions

**Files to delete:**
- `src/pages/Live.tsx`
- `src/pages/LiveSession.tsx`

**Routes to remove from `src/App.tsx`:**
- Lines 135-144 (Live session routes)

**Navigation updates in `src/layouts/MainLayout.tsx`:**
- Remove Live from navigation array (line 41)
- Remove `Video` icon import (line 7)

**Store cleanup in `src/stores/uiStore.ts`:**
- Remove `activeLiveSession` state (line 33)
- Remove `setActiveLiveSession` action (lines 62, 128)

### Backend
- Keep `supabase/functions/lives/` but do not call it
- Tables remain but are unused

---

## CHANGE 2: REPLACE "LEARN" WITH "TRENDING" IN FEED

### Files to modify

**`src/pages/Feed.tsx`:**
- Line 441: Change "Learn" to "Trending"
- Lines 350-354: Update query logic for trending (order by engagement score instead of filtering by type)

**`src/stores/uiStore.ts`:**
- Line 3: Update `FeedTab` type from `'learn'` to `'trending'`
- Line 76: Update default if needed

### New Trending Logic
```typescript
// For 'trending' tab, order by engagement (saves + likes + answers) from last 48 hours
if (activeFeedTab === 'trending') {
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  query = query
    .gte('created_at', twoDaysAgo)
    .order('like_count', { ascending: false });
}
```

---

## CHANGE 3: USE COMPASS ICON FOR MARKET TAB

### File to modify

**`src/layouts/MainLayout.tsx`:**
- Line 40: Change `icon: BarChart3` to `icon: Compass` for Markets entry
- Keep label as "Markets"
- Keep route as `/markets`

---

## CHANGE 4: DELETE DISCOVER PAGE

### Files to delete
- `src/pages/Discover.tsx`

### Routes to remove from `src/App.tsx`
- Lines 90-94 (Discover route)
- Update redirect on line 157-159 from `/discover` to `/feed`

### Navigation updates in `src/layouts/MainLayout.tsx`
- Remove Discover from navigation array (line 39)
- Since Compass icon now used for Markets, remove redundant Compass import if not needed elsewhere

### Search bar redirect update in `src/layouts/MainLayout.tsx`
- Line 74: Change `onClick={() => navigate('/discover')}` - this becomes the typeahead trigger

---

## CHANGE 5: INSTANT SEARCH DROPDOWN (TYPEAHEAD)

### New component: `src/components/search/SearchTypeahead.tsx`

Create floating search panel with:
- Debounced search (150ms)
- Sections: Posts (3), People (3), Topics (3)
- Click opens detail in-place
- No page navigation

### Implementation in `src/layouts/MainLayout.tsx`
- Replace search button with Input + SearchTypeahead component
- Add state for search query and results
- Use existing search logic from `src/pages/Discover.tsx` (useSearch hook)

### Search API call
```typescript
// Reuse logic from Discover.tsx useSearch hook
const [postsResult, usersResult, topicsResult] = await Promise.all([
  supabase.from('posts').select('id, title, body, type')
    .or(`title.ilike.%${query}%,body.ilike.%${query}%`).limit(3),
  supabase.from('profiles').select('id, full_name, username, avatar_url, is_verified')
    .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`).limit(3),
  supabase.from('topics').select('id, name, follower_count')
    .ilike('name', `%${query}%`).limit(3),
]);
```

---

## CHANGE 6: MOBILE NAVIGATION TRANSFORMATION

### Create new component: `src/components/layout/MobileBottomNav.tsx`

Icons: Home, Markets, Create (center), Notifications, Profile

### Create new component: `src/components/layout/MobileTopBar.tsx`

Layout: Logo (left) | Search (center) | Messages icon (right)

### Modify `src/layouts/MainLayout.tsx`

Add responsive logic:
```typescript
const isMobile = useIsMobile(); // from use-mobile.tsx hook

{!isMobile && <DesktopNav />}
{isMobile && (
  <>
    <MobileTopBar />
    {/* Content */}
    <MobileBottomNav />
  </>
)}
```

### MobileBottomNav structure
```typescript
const mobileNav = [
  { name: 'Home', href: '/feed', icon: Home },
  { name: 'Markets', href: '/markets', icon: Compass },
  { name: 'Create', action: () => setCreateHubOpen(true), icon: Plus, center: true },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Profile', href: '/profile', icon: User },
];
```

---

## CHANGE 7: REMOVE CHAT WITH PI CTA

### Files to modify

**`src/layouts/MainLayout.tsx`:**
- Line 147: Remove `<PiCopilot />` component
- Remove import for PiCopilot (line 12)

### Files to delete
- `src/components/pi/PiCopilot.tsx`
- `src/components/pi/PiChatPanel.tsx`

### Keep these files (AI still active in background)
- `src/components/pi/AskBottomSheet.tsx` - for question posting flow
- `supabase/functions/ai-chat/`
- `supabase/functions/ai-rewrite/`
- `supabase/functions/ai-suggest-tags/`
- `supabase/functions/ai-generate-answer/`

### Modify `src/components/pi/AskBottomSheet.tsx`
- Remove "Chat with Pi" button (lines 155-160)

---

## CHANGE 8: LOGOUT LOCATION

### Remove logout from `src/layouts/MainLayout.tsx`
- Lines 117-125: Remove logout button from header
- Remove handleLogout function (lines 26-34)

### Remove logout from `src/pages/Markets.tsx`
- Lines 242-249: Remove logout button from MarketNav

### Add logout to `src/pages/Profile.tsx`
Add at bottom of profile page (after Tabs):
```typescript
{isOwnProfile && (
  <Card className="mt-6">
    <CardContent className="p-6">
      <Button
        variant="destructive"
        onClick={handleLogout}
        className="w-full"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Log out
      </Button>
    </CardContent>
  </Card>
)}
```

Add handleLogout function and import supabase.

---

## CHANGE 9: MOBILE UI CONSISTENCY PASS

### Audit and fix across all pages

Ensure consistent:
- Font sizes: text-sm, text-base, text-lg standard
- Padding: p-4, p-6 standard
- Border radius: rounded-xl for cards, rounded-2xl for buttons
- Colors: Use design tokens only
- Button heights: h-10 (small), h-12 (medium), h-14 (large)
- Input styles: bg-secondary/50 border-border/50

### Specific fixes
- Check `PostCard` component for text clipping
- Check `Avatar` components for cropping
- Ensure grids don't break on 360px width

---

## CHANGE 10: LOGO REPLACEMENT + LOADER

### Asset handling

Copy uploaded logo files to project:
```
lov-copy user-uploads://Untitled_2.png src/assets/logo-icon.png
lov-copy user-uploads://Untitled_3.png src/assets/logo-full.png
```

### Update locations

**`src/layouts/MainLayout.tsx`:**
Replace TrendingUp icon with logo image:
```typescript
import logoIcon from '@/assets/logo-icon.png';
// ...
<img src={logoIcon} alt="InvestorPaisa" className="h-9 w-9" />
```

**`src/pages/Landing.tsx`:**
Same logo replacement in header

**`src/components/layout/MobileTopBar.tsx`:**
Use logo-icon for mobile header

**`src/components/ui/page-loader.tsx`:**
Replace spinner with logo + pulse animation:
```typescript
import logoIcon from '@/assets/logo-icon.png';

export const PageLoader: React.FC = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <motion.img
          src={logoIcon}
          alt="Loading"
          className="h-16 w-16"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
    </div>
  );
};
```

**`public/favicon.ico`:**
Replace with new logo icon

**`index.html`:**
Update favicon reference if needed

---

## CHANGE 11: QUESTION POSTING + SOCIAL SHARING

### Verify posting works
Test paths:
- AskBottomSheet post flow
- CreateHub modal
- Direct from feed

### Add Share button to `src/pages/Feed.tsx` PostCard

Already has share with copy link. Add share options sheet:

```typescript
const handleShare = async (e: React.MouseEvent) => {
  e.stopPropagation();
  const url = `${window.location.origin}/post/${post.id}`;
  
  if (navigator.share) {
    await navigator.share({
      title: post.title || 'Check out this post',
      url: url,
    });
  } else {
    // Fallback: show share options
    setShowShareSheet(true);
  }
};
```

### Create `src/components/posts/ShareSheet.tsx`
Options: Copy Link, WhatsApp, Twitter/X, LinkedIn, Facebook

### Auth Gate for interactions

In `src/pages/Feed.tsx` PostCard:
```typescript
const handleInteraction = (action: () => void) => {
  if (!user) {
    openAuthGate('interact');
    return;
  }
  action();
};
```

Add AuthGate modal component with Google/Email options.

---

## CHANGE 12: FIX MARKET DATA & PROFILE PAGE LOADING

### Market Data Debug

**`src/services/market/marketService.ts`:**
- Add better error logging
- Check CORS handling
- Verify env vars loaded

**`supabase/functions/fetch-nse-data/index.ts`:**
- Check API key configuration
- Add fallback mock data for dev

### Profile Page Fix

**`src/pages/Profile.tsx`:**
- Ensure auth token attached to requests
- Add proper loading states
- Fix redirect on line 97-99 (should be `/auth` not `/auth/login`)

---

## File Change Summary

### Files to CREATE
1. `src/components/search/SearchTypeahead.tsx`
2. `src/components/layout/MobileBottomNav.tsx`
3. `src/components/layout/MobileTopBar.tsx`
4. `src/components/posts/ShareSheet.tsx`
5. `src/components/auth/AuthGateModal.tsx`
6. `src/assets/logo-icon.png` (copied from upload)
7. `src/assets/logo-full.png` (copied from upload)

### Files to DELETE
1. `src/pages/Live.tsx`
2. `src/pages/LiveSession.tsx`
3. `src/pages/Discover.tsx`
4. `src/components/pi/PiCopilot.tsx`
5. `src/components/pi/PiChatPanel.tsx`

### Files to MODIFY
1. `src/App.tsx` - Remove routes
2. `src/layouts/MainLayout.tsx` - Major navigation changes
3. `src/pages/Feed.tsx` - Learn to Trending, share button
4. `src/pages/Profile.tsx` - Add logout button
5. `src/pages/Markets.tsx` - Remove logout from nav
6. `src/pages/Landing.tsx` - Logo update
7. `src/stores/uiStore.ts` - Update types
8. `src/components/pi/AskBottomSheet.tsx` - Remove Pi chat button
9. `src/components/ui/page-loader.tsx` - New logo loader
10. `index.html` - Favicon update
11. `src/services/market/marketService.ts` - Debug fixes

---

## Regression Test Checklist

After implementation, verify:
- [ ] Can sign up (email OTP)
- [ ] Can log in (email + Google)
- [ ] Can post question
- [ ] Can see feed (all 3 tabs)
- [ ] Can like/save posts
- [ ] Can search with typeahead
- [ ] Can open Markets page
- [ ] Can open Profile page
- [ ] Can log out from Profile
- [ ] Mobile nav works
- [ ] Share sheet opens
- [ ] No Live references in UI
- [ ] No Discover references in UI
- [ ] Trending tab shows engagement-sorted content

---

## Implementation Order

1. Copy logo assets first
2. Delete unused files (Live, Discover, Pi Chat)
3. Update App.tsx routes
4. Modify MainLayout navigation
5. Create mobile nav components
6. Create search typeahead
7. Update Feed.tsx (Learn to Trending)
8. Update Profile.tsx (add logout)
9. Update page-loader
10. Create share sheet
11. Mobile consistency pass
12. Test all flows
