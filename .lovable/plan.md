
# InvestorPaisa Production Readiness - UI/UX & Permissions Fix Plan

## Executive Summary

This plan addresses 7 major issues spanning navigation, content actions, profile display, posting workflow, user tier permissions, and data integration. Based on code exploration, I've identified the specific changes needed in each file.

---

## Issue 1: Duplicate Navigation Bar in Stock Detail Page

### Current State
`StockDetail.tsx` has its own `StockDetailNav` component (lines 46-131) that creates a second navigation bar below the main `MainLayout` header.

### Screenshot Evidence
The screenshot shows two navigation bars - the main InvestorPaisa header at top, and a duplicate "InvestorPaisa" navigation row below it.

### Solution
Remove the `StockDetailNav` component entirely and ensure StockDetail.tsx is rendered within MainLayout (which already provides the navigation).

### Technical Changes

```text
+---------------------------------------+
| File: src/pages/StockDetail.tsx       |
+---------------------------------------+
| 1. Remove StockDetailNav component    |
|    (lines 46-131)                     |
| 2. Remove the <StockDetailNav />      |
|    usage in the return statement      |
+---------------------------------------+
```

### Files Modified
- `src/pages/StockDetail.tsx`

---

## Issue 2: Content Action CTAs Standardization

### Current State
- `PostCard.tsx` has: Like, Comment, Bookmark (footer) + Share, Report, Hide (3-dot menu)
- Missing: Upvote/Downvote, Repost CTA
- `PostDetail.tsx` has Back button positioned above the widget, not aligned left

### Requirements Per Tier Matrix
All content should have:
- Upvote (ArrowUp)
- Downvote (ArrowDown)
- Repost (with or without opinion)
- Save (Bookmark)
- Share (under 3-dots)
- Report spam (under 3-dots, not for own content)
- Hide user (under 3-dots, not for own content)

### Solution

#### A. Update PostCard.tsx Footer
Replace Like/Comment with Upvote/Downvote/Comment/Repost/Save pattern:

```text
Footer Layout:
[Upvote | Downvote | Comment | Repost | Save]
     (equidistant in mobile)
```

#### B. Fix PostDetail.tsx Back Button Position
Move Back button to be inline with the content card (left-aligned, same row as card start), not centered above.

### Files Modified
- `src/components/posts/PostCard.tsx` - Replace footer actions
- `src/pages/PostDetail.tsx` - Fix back button alignment
- `src/pages/Feed.tsx` - Update FeedPostCard to match pattern

---

## Issue 3: Profile Icon Styling in Navigation

### Current State
From `MainLayout.tsx` lines 134-147:
- Profile button uses `rounded-full` instead of `rounded-xl` like other nav icons
- The `AvatarWithRing` component shows a progress ring around the avatar
- The ring color (cyan/teal) is visible based on profile completion percentage

### Screenshot Evidence
Profile icon has circular hover state while others have rounded-xl (12px radius). There's a cyan element (the progress ring) extending beyond the avatar.

### Solution

#### A. Match Profile Button Styling
Change profile button to use same `rounded-xl h-10 w-10` pattern as other nav buttons.

#### B. Conditionally Hide Ring in Navigation
Only show the ring when viewing profile page, not in nav header. In header, use simple Avatar.

### Technical Changes

```text
+---------------------------------------+
| File: src/layouts/MainLayout.tsx      |
+---------------------------------------+
| Line 134-147: Replace AvatarWithRing  |
| with plain Avatar in nav, and use     |
| rounded-xl styling on the button      |
+---------------------------------------+
```

### Files Modified
- `src/layouts/MainLayout.tsx`

---

## Issue 4: Markets & Trending Data + UI Improvements

### Current State
- `TrendingStructuredFeed.tsx` includes `LeaderboardWidget` showing "Top Influencers" - user wants this removed
- Markets page has refresh button that should be conditional (only show on error)
- AI Insight panel has refresh button - should be hidden when insight is already generated
- Spacing issues between Price Chart and Volume toggle
- Indian indices data not loading

### Solution

#### A. Remove Top Influencers Widget
Delete `LeaderboardWidget` component and its usage from `TrendingStructuredFeed.tsx`.

#### B. Conditional Refresh Buttons
- In `Markets.tsx`: Only show refresh button if there was an error loading data
- In `AIInsightPanel.tsx`: Hide refresh button when insight is successfully loaded
- In `StockDetail.tsx`: Remove refresh button when data is loaded successfully

#### C. Fix Spacing
Reduce gap between Price Chart header and Volume toggle.

#### D. Mobile Optimization
- Reduce padding/spacing across Markets and StockDetail pages
- Make charts more compact on mobile
- Ensure all content is readable without excessive scrolling

#### E. Fix Indian Indices
The symbols `NIFTY50`, `SENSEX`, `BANKNIFTY`, `NIFTYIT` need proper mapping to actual tradeable symbols in the market-data edge function.

### Files Modified
- `src/components/feed/TrendingStructuredFeed.tsx`
- `src/pages/Markets.tsx`
- `src/pages/StockDetail.tsx`
- `src/components/market/AIInsightPanel.tsx`

---

## Issue 5: Post to Public/Community Option

### Current State
`CreateHub.tsx` has options for Question, Opinion, Community, and Brand Collaboration. However:
- No option to choose between posting publicly or to a specific community
- Brand Collaboration shows "Coming Soon" but the badge positioning is off (content outside widget)

### Solution

#### A. Add Community/Public Selector
When user selects "Ask Question" or "Share Opinion", add a toggle/selector to choose:
- Public (default) - visible to all
- Community - select from user's communities

#### B. Fix Brand Collaboration Badge
Ensure the "Coming Soon" badge and all content stays within the card widget.

### Technical Changes

```text
+---------------------------------------+
| File: src/components/create/          |
|       CreateHub.tsx                   |
+---------------------------------------+
| 1. Add community selector state       |
| 2. Add CircleSelector component       |
|    after question/opinion input       |
| 3. Update post insert to include      |
|    community_id if selected           |
| 4. Fix Brand Collab card layout       |
+---------------------------------------+
```

### Files Modified
- `src/components/create/CreateHub.tsx`

---

## Issue 6: Public Profile Enhancements

### Current State
From `PublicProfile.tsx`:
- "See all" button exists but may not be functioning properly
- Posts section shows up to 2 posts (lines 599-624)
- Missing Expert badge display
- Activity CTAs missing on post widgets within profile

### Requirements
- "See all" should navigate to `/u/:username?tab=posts`
- Expert badge should show on public profile
- Post widgets in profile should have same action CTAs as main feed

### Solution

#### A. Fix See All Navigation
The button at line 580 already has `onClick={() => navigate(\`/u/${profile.username}?tab=posts\`)}`. Need to:
1. Handle the `?tab=posts` query param in PublicProfile
2. Show full posts list when tab=posts is active

#### B. Add Expert Badge
Add tier badge display near the user's name:

```typescript
{(profile as any).tier === 'expert' && (
  <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-[10px]">
    Expert
  </Badge>
)}
```

#### C. Add Action CTAs to Post Widgets
Update the post cards in Recent Activity section to include:
- Upvote/Downvote
- Comment count (clickable)
- Repost
- Save

### Files Modified
- `src/pages/PublicProfile.tsx`

---

## Issue 7: User Tier Access Rights Enforcement

### Current State
From `useUserTier.ts`:
- Permissions are defined correctly
- `canComment`, `canAskQuestion`, `canPostOpinion` are false for unverified users
- BUT these permissions aren't being enforced in the UI consistently

### Requirements from Screenshot
| Action | UV users | V users | Influencers | Experts |
|--------|----------|---------|-------------|---------|
| Like | Y | Y | Y | Y |
| Share | Y | Y | Y | Y |
| Comment | | Y | Y | Y |
| Post | | Y | Y | Y |
| Messages | | Y | Y | Y |
| AI Copilot | | | Y | Y |
| Profile promotion | | | Y | Y |
| Brand collaboration | | | Y | Y |
| Paid Listing | | | | Y |
| Mass Outreach | | | | Y |

### Solution

#### A. Add canMessage Permission
Update `useUserTier.ts` to include `canMessage` permission (not available for UV users).

#### B. Enforce Permissions in Components
1. **CreateHub.tsx**: Check `permissions.canPostOpinion` before allowing post
2. **InlineAnswerInput.tsx**: Check `permissions.canComment` before showing
3. **PublicProfile.tsx**: Check `permissions.canMessage` before enabling Message button
4. **Feed.tsx**: Show verification prompt when UV user tries to comment/post

#### C. Show Tier-Gated CTAs with Verification Prompt
For actions unavailable to current tier:
- Show the button but with disabled state
- On click, show VerificationModal prompting to verify account

### Technical Changes

```text
+---------------------------------------+
| File: src/hooks/useUserTier.ts        |
+---------------------------------------+
| Add canMessage to TierPermissions     |
| - guest: false                        |
| - unverified_user: false              |
| - verified_user: true                 |
| - influencer: true                    |
| - expert: true                        |
+---------------------------------------+

+---------------------------------------+
| Files to Enforce:                     |
+---------------------------------------+
| - CreateHub.tsx                       |
| - InlineAnswerInput.tsx               |
| - PublicProfile.tsx                   |
| - Feed.tsx (FeedPostCard)             |
| - PostDetail.tsx                      |
+---------------------------------------+
```

### Files Modified
- `src/hooks/useUserTier.ts`
- `src/components/create/CreateHub.tsx`
- `src/components/answer/InlineAnswerInput.tsx`
- `src/pages/PublicProfile.tsx`
- `src/pages/Feed.tsx`
- `src/pages/PostDetail.tsx`

---

## Implementation Order

```text
+------------------------------------------------------------------------+
|  EXECUTION ORDER                                                        |
+------------------------------------------------------------------------+
|  1. Fix Navigation Issues (Quick wins)                                 |
|     - Remove StockDetailNav duplicate                                   |
|     - Fix profile icon styling in MainLayout                            |
|                                                                         |
|  2. Standardize Content Actions                                        |
|     - Update PostCard.tsx with Upvote/Downvote/Repost                   |
|     - Update Feed.tsx FeedPostCard to match                             |
|     - Fix PostDetail.tsx back button alignment                          |
|                                                                         |
|  3. Markets & Trending Improvements                                    |
|     - Remove Top Influencers widget                                     |
|     - Add conditional refresh buttons                                   |
|     - Fix spacing issues                                                |
|     - Mobile optimization                                               |
|                                                                         |
|  4. Post Creation Enhancements                                         |
|     - Add community selector to CreateHub                               |
|     - Fix Brand Collab card layout                                      |
|                                                                         |
|  5. Public Profile Fixes                                               |
|     - Add Expert badge                                                  |
|     - Fix See all navigation with tab handling                          |
|     - Add action CTAs to activity posts                                 |
|                                                                         |
|  6. Tier Permission Enforcement                                        |
|     - Add canMessage to permissions                                     |
|     - Enforce permissions across all interactive components             |
|     - Add verification prompts for gated actions                        |
+------------------------------------------------------------------------+
```

---

## Files Summary

| Issue | Files Modified |
|-------|----------------|
| 1. Duplicate Nav | StockDetail.tsx |
| 2. Content Actions | PostCard.tsx, PostDetail.tsx, Feed.tsx |
| 3. Profile Icon | MainLayout.tsx |
| 4. Markets/Trending | TrendingStructuredFeed.tsx, Markets.tsx, StockDetail.tsx, AIInsightPanel.tsx |
| 5. Post Creation | CreateHub.tsx |
| 6. Public Profile | PublicProfile.tsx |
| 7. Permissions | useUserTier.ts, CreateHub.tsx, InlineAnswerInput.tsx, PublicProfile.tsx, Feed.tsx, PostDetail.tsx |

---

## Testing Checklist

### Navigation & UI
- [ ] Stock detail page shows only one navigation bar
- [ ] Profile icon in nav has rounded-xl hover state (not circular)
- [ ] No cyan ring around profile icon in navigation
- [ ] Back button in PostDetail is left-aligned with content

### Content Actions
- [ ] All post cards show: Upvote, Downvote, Comment, Repost, Save
- [ ] 3-dot menu shows: Share, Report spam, Hide user
- [ ] Report spam and Hide user NOT shown for own posts
- [ ] Repost opens opinion modal

### Markets & Trending
- [ ] No "Top Influencers" widget in trending feed
- [ ] Refresh button hidden when data loads successfully
- [ ] AI Insight refresh button hidden after insight generated
- [ ] Reduced spacing on mobile views
- [ ] Indian indices (NIFTY50, SENSEX) show data

### Posting
- [ ] Can select public vs community when posting
- [ ] Brand Collaboration card properly contained

### Profiles
- [ ] Expert badge shows on public profile
- [ ] "See all" navigates to posts tab
- [ ] Activity posts have action CTAs

### Permissions
- [ ] Unverified user CANNOT comment, post, or message
- [ ] Message button disabled until following AND verified
- [ ] Clicking gated action shows verification prompt
- [ ] Verified users CAN comment, post, message
- [ ] Expert features only visible to experts

---

## Technical Notes

### Permission Matrix Reference
From the user's screenshot, the permission model is:
- **UV (Unverified)**: Like, Share only
- **V (Verified)**: Like, Share, Comment, Post, Messages
- **Influencer**: All V permissions + AI Copilot, Profile promotion, Brand collaboration
- **Expert**: All Influencer permissions + Paid Listing, Mass Outreach

### Mobile Optimization Priority
The Markets page needs significant mobile optimization:
1. Reduce all padding from p-4 to p-2 or p-3
2. Make chart height responsive (smaller on mobile)
3. Collapse indicator panels on mobile
4. Ensure all text is readable without horizontal scroll

### Community Posts in Following Tab
When a user posts to a community they're a member of, that post should:
1. Appear in the community feed
2. Appear in the user's followers' "Following" tab
3. NOT appear in public "Pulse" or "Trending" tabs if community is closed
