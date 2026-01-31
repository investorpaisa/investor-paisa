

# InvestorPaisa Execution-Level Specification Alignment Plan

## Executive Summary

This plan compares the current codebase against the execution-level specification and outlines the changes needed to bring the application into full compliance. The spec defines exact workflows, screen designs, API call patterns, state machines, and failure handling that must be implemented precisely.

---

## Current State Analysis

### What Exists (Partially Aligned)

| Feature | Current State | Spec Requirement |
|---------|--------------|------------------|
| Landing Page | Generic hero, stats, testimonials | Simple hero with "Ask anything about money" + Continue/Sign in CTAs |
| Auth | Email/password + Google OAuth | OTP-based authentication (single email input, OTP verification) |
| Home Feed | Tabs-based dashboard | Pulse/Learn/Following tabs with skeleton loading |
| Post Cards | Basic like/comment/share | Double-tap like, swipe gestures, radial menu on long-press |
| Markets | Quote cards, charts, indicators | Mostly compliant, needs stale label and AI insights |
| Notifications | Working with filters | Compliant but needs navigation on tap + PATCH call |
| Messages | Placeholder only | Full conversation list + thread view required |
| Profile | Working with tabs | Needs saved posts tab and filter switching |

### What Is Missing (Requires Implementation)

1. **Pi Copilot / Command Palette** - The floating AI assistant with chat, question rewriting, answer generation
2. **Post Detail Page** (/post/:id) - Hero section + answers list
3. **Answer Creation Workflow** - AI-generated answers with Simple/Detailed/Steps tabs
4. **Create Hub** - Link drop zone with format conversion (thread/carousel/video/tip)
5. **Live Sessions** - Discovery, joining, websocket chat, AI summarization
6. **Expert Profiles** - Track button, "Ask Question" shortcut, session booking
7. **Explore Page Sections** - Trending topics, rising experts, creator spotlights
8. **Search Functionality** - Real-time search with debounce
9. **Gesture-based Interactions** - Swipe left (ask similar), swipe right (save), double-tap (like), long-press (radial menu)

---

## Implementation Phases

### Phase 1: Landing Page & Authentication Overhaul

**Landing Page Changes:**
- Replace current complex hero with minimal design
- Headline: "Ask anything about money."
- Subtext: "AI + community + experts."
- Primary CTA: "Continue" (navigates to Home Feed, anonymous)
- Secondary CTA: "Sign in" (navigates to Auth Page)
- Add animated soft gradient noise background
- Add limited Pulse feed preview (first 10 items, read-only)
- Auth Gate modal on like/save tap when logged out

**Authentication Redesign:**
- Single page with email input only (no password initially)
- POST /auth/request-otp on "Continue"
- OTP input screen with verification
- POST /auth/verify-otp
- On success: store tokens, GET /me, redirect to intended screen
- Inline error on failure

### Phase 2: Home Feed with Full Interaction Model

**Feed Tabs:**
- Pulse (default) / Learn / Following tabs
- Show skeleton cards (6) on load
- GET /feed/{mode}?cursor= on tab switch
- Infinite scroll at 70% (append with cursor pagination)

**Post Card Interactions:**
- Double-tap: Like animation, optimistic increment, POST /reactions
- Swipe right: Bookmark animation, POST /reactions (type: save)
- Swipe left: Open inline composer below card for "Ask Similar"
- Long-press: Radial menu (Report, Hide, Copy Link)

**Post Card State Machine:**
```
States: Idle | Liked | Saved | Error
Transitions:
  Idle -> Liked (on double-tap success)
  Idle -> Saved (on swipe-right success)
  Liked/Saved -> Error (on API failure) -> rollback to previous
```

### Phase 3: Pi Copilot (AI Command Palette)

**Floating CTA (Orb):**
- Replace current plus button with Pi orb
- On tap: Open command palette (bottom sheet)

**Command Palette Features:**
- "Ask PaisaBot" - Opens chat panel
- POST /ai/chat with streaming response
- "Save as Post" - Prefills Create Hub

**One-Screen Ask Workflow:**
- Floating Pi tap opens bottom sheet
- Focus input with keyboard
- On type (300ms debounce):
  - POST /ai/rewrite-question (ghost text)
  - POST /ai/suggest-tags
- On "Post" button:
  - POST /posts
  - Close sheet, insert at index 0, scroll to top

**Ask Sheet State Machine:**
```
States: Closed | Opening | Open | Submitting | Error
```

### Phase 4: Post Detail & Answer System

**Post Detail Page (/post/:id):**
- Navigate on PostCard tap
- Parallel calls: GET /posts/{id}, GET /answers?post_id=
- Render hero section (skeleton first)
- Render answers list when loaded

**Answer Creation:**
- Bottom sheet on "Answer" tap
- POST /ai/generate-answer {post_id}
- Returns: { simple, detailed, steps }
- Tab navigation between formats
- User edits, presses "Post Answer"
- POST /answers
- Close sheet, insert answer at top with glow animation
- Trigger trust score update

**Answer Sheet State Machine:**
```
States: Closed | Generating | Open | Submitting | Error
```

### Phase 5: Create Hub & Link Conversion

**Create Hub Workflow:**
- Access from dock/nav
- Drop zone for links (YouTube, articles, etc.)
- On link drop: POST /ai/convert-link
- Returns format options: thread, carousel, video, tip
- User selects format, preview updates
- User edits content
- On "Publish": POST /posts
- Return to feed

### Phase 6: Explore Page Rebuild

**Parallel API Calls:**
- GET /topics/trending
- GET /experts/rising
- GET /creators/spotlight

**Sections:**
- Trending Topics (cards with follow button)
- Rising Experts (profile cards with Track button)
- Creator Spotlights (featured creators)

**Search:**
- On type (200ms debounce): GET /search?q=
- Results appear inline

### Phase 7: Expert Profile System

**Expert Profile Page:**
- GET /experts/{id}
- CTAs:
  - Track: POST /follow (optimistic toggle)
  - Ask Question: Opens Pi with expert_id context
  - Book Session: External link

### Phase 8: Live Sessions

**Live Sessions Discovery:**
- GET /lives (list of scheduled/live sessions)

**Join Flow:**
- Tap card, video loads
- Websocket connection opens
- Chat input with AI rewrite (inline)
- POST /lives/{id}/messages

**Session End:**
- System calls POST /ai/summarize-live
- Creates summary post/replay

### Phase 9: Messages System

**Conversations List:**
- GET /conversations
- Display with last message preview

**Thread View:**
- GET /messages?conversation_id=
- POST /messages on send
- Optimistic bubble insertion

### Phase 10: Profile Enhancements

**Profile Page:**
- GET /users/{id} or GET /users/me
- Tab switching: Posts | Answers | Saved
- GET /users/{id}/{posts|answers|saved} per tab

**Edit Profile:**
- Bottom sheet with Name, Tagline, Bio
- PUT /users/me on save

---

## Technical Implementation Details

### New Edge Functions Required

1. **auth-otp** - Request and verify OTP
2. **ai-rewrite** - Rewrite questions
3. **ai-generate-answer** - Generate answer variants
4. **ai-convert-link** - Convert links to content formats
5. **ai-chat** - Chat with PaisaBot
6. **ai-summarize-live** - Summarize live sessions
7. **lives** - Live session management

### Database Changes

1. Add `live_session_messages` table
2. Add `live_session_participants` table
3. Add `search_history` table
4. Ensure `answers` table has proper indexes

### Frontend Components to Create

1. `PiCopilot.tsx` - Floating orb + command palette
2. `AskBottomSheet.tsx` - One-screen ask UI
3. `AnswerBottomSheet.tsx` - Answer creation with AI tabs
4. `CreateHub.tsx` - Link drop zone + format selection
5. `PostDetail.tsx` - Post hero + answers
6. `LiveSessionCard.tsx` - Session list item
7. `LiveSessionView.tsx` - Live session with chat
8. `ExpertProfile.tsx` - Expert-specific profile view
9. `RadialMenu.tsx` - Long-press context menu
10. `SwipeablePostCard.tsx` - Post card with gesture support

### State Management Updates

- Add to `uiStore.ts`:
  - `isAskSheetOpen`
  - `isAnswerSheetOpen`
  - `isCreateHubOpen`
  - `activeLiveSession`

### Routes to Add/Modify

- `/post/:id` - Post detail (NEW)
- `/live/:id` - Live session view (NEW)
- `/expert/:id` - Expert profile (NEW)
- Remove `/dashboard`, `/circles`, `/circle/:circleId`

---

## Empty States (Required for Each Module)

Each module must have:
- Icon
- Title
- Explanation
- CTA button

No blank screens allowed.

---

## Failure State Handling

For any API call:
- If timeout: Show inline retry button
- If 401: Show login modal
- If 500: Show "Something went wrong" with retry

---

## Analytics Events

Every user action must emit:
```json
{
  "event_name": "...",
  "user_id": "...",
  "session_id": "...",
  "screen": "...",
  "entity_id": "...",
  "timestamp": "..."
}
```

---

## Performance Requirements

| Endpoint | Target |
|----------|--------|
| Feed load | < 800ms |
| Quote fetch | < 250ms |
| AI response | < 900ms |

---

## Acceptance Test Script

The build passes only if ALL these steps work:

1. Open app (landing page loads)
2. Tap "Continue" (navigate to home feed anonymous)
3. Scroll feed (infinite scroll works)
4. Double-tap post (like animation, count increments)
5. Ask question (via Pi, post creates)
6. Answer question (AI generates, answer posts)
7. Save post (swipe right, bookmark animation)
8. Follow expert (optimistic toggle)
9. View stock (chart loads with real data)
10. Join live session (video + chat works)
11. Receive notification (tap navigates correctly)

If any step breaks, the implementation is incomplete.

---

## Implementation Priority

1. **Critical Path**: Landing, Auth, Feed, PostCard interactions
2. **Core AI**: Pi Copilot, Ask workflow, Answer generation
3. **Content Creation**: Create Hub, Link conversion
4. **Discovery**: Explore page, Search, Expert profiles
5. **Engagement**: Live sessions, Messages
6. **Polish**: Gestures, animations, empty states, error handling

---

## Files to Delete (Not in Spec)

- `src/pages/Dashboard.tsx` - Not in spec
- `src/pages/Circles.tsx` - Replaced by Explore/Network
- `src/pages/Circle.tsx` - Not in spec
- `src/components/circles/*` - Not in spec
- Professional-related components if not needed

---

## Summary

This plan transforms InvestorPaisa from its current state (a traditional social platform) into the spec-defined AI-powered financial Q&A community with:

- OTP-based authentication
- Gesture-based post interactions
- AI-powered question rewriting and answer generation
- Live sessions with real-time chat
- Link-to-content conversion
- Expert tracking and discovery

All implementations must follow the exact API call patterns, state machines, and UI behaviors defined in the specification.

