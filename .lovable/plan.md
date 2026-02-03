

# InvestorPaisa Production Readiness - Comprehensive Fix Plan

## Root Cause Analysis Summary

Based on thorough investigation of the codebase, edge functions, and database:

### Issue 1: Mobile OTP - "Server returned invalid response"
**ROOT CAUSE IDENTIFIED**: The edge function IS working correctly (tested directly). The issue is that the **Twilio account is in trial mode** and can only send SMS to verified phone numbers. 

**Evidence:**
```json
{
  "success": true,
  "smsSent": false,
  "smsError": "The number +91123456XXXX is unverified. Trial accounts cannot send messages to unverified numbers"
}
```

The frontend receives `success: true` even when SMS fails (for dev mode testing), but the OTP is generated and returned as `dev_otp`. The real fix is either:
1. Upgrade Twilio to a paid account, OR
2. Replace Twilio with Lovable AI's built-in SMS capability (if available), OR
3. Use a different SMS provider (like Resend for SMS)

**Frontend Issue**: The error message is misleading. The modal should show that OTP was generated successfully (even if SMS failed in dev mode).

### Issue 2: LinkedIn Connect - "Server returned invalid response"
**ROOT CAUSE IDENTIFIED**: The edge function IS working correctly. Test shows it returns a valid auth URL:
```json
{
  "authUrl": "https://www.linkedin.com/oauth/v2/authorization?...",
  "state": "3a3f739b-a177-4cbe-b263-5e2c0b9c9c82"
}
```

**Real Issue**: The frontend is getting a non-JSON response due to missing Authorization header when the user session is not properly attached, or CORS issues.

### Issue 3: Google Sign-in Not Landing on Feed
**ROOT CAUSE**: The `lovable.auth.signInWithOAuth` correctly redirects, but the callback handling in `AuthContext.tsx` may not be properly setting the session after OAuth redirect.

**Evidence from Auth.tsx (line 43-52)**:
```typescript
useEffect(() => {
  if (user) {
    navigate('/feed');
  }
}, [user, navigate]);
```
This should work, but the issue may be in the OAuth callback flow not setting the session properly.

### Issue 4: Public Profile Truncation + "See More"
**Current State**: `PublicProfile.tsx` uses `line-clamp-3` for bio which truncates without a "See more" option.

**Missing Features**:
- No "See more" button for bio
- No display of Experience, Education, Certifications sections
- No privacy setting checks for what sections to show

### Issue 5: Search -> Public Profile Navigation
**ROOT CAUSE FOUND**: `SearchTypeahead.tsx` navigates to `/profile/${username}` instead of `/u/${username}`:
```typescript
const handleUserClick = (username: string | null) => {
  if (username) {
    navigate(`/profile/${username}`);  // WRONG - should be /u/${username}
    onResultClick();
  }
};
```

### Issue 6: Trending Tab & Markets Empty
**ROOT CAUSE FOUND**: 
- **News**: Was stale (Jan 31) but `fetch-google-rss` successfully inserted 21 new articles when called
- **Markets**: Edge function IS working - returns valid data from TwelveData

The issue is that the `fetch-google-rss` cron job is not set up to run every 5 minutes.

---

## Implementation Plan

### Phase 1: Mobile OTP Fix (High Priority)

**Problem**: Twilio trial mode limitation + misleading error messages

**Solution**:
1. Update `MobileVerificationModal.tsx` to handle the `success: true, smsSent: false` case properly
2. Show the dev OTP clearly when SMS fails (for testing)
3. Add a note that SMS requires Twilio account upgrade for production

**Files to Modify**:
- `src/components/profile/MobileVerificationModal.tsx`
- No edge function changes needed - it's working correctly

**Technical Changes**:
```typescript
// In handleRequestOTP, after parseJsonResponse:
if (data.success) {
  setFlowState('sent');
  setCountdown(60);
  
  if (data.smsSent) {
    toast.success('OTP sent to your phone!');
  } else if (data.dev_otp) {
    // Dev mode - show OTP in modal
    setDevOtp(data.dev_otp);
    toast.info('SMS not available - use code shown below');
  }
  
  if (data.smsError) {
    console.warn('[OTP] SMS Error:', data.smsError);
  }
}
```

---

### Phase 2: LinkedIn Connect Fix

**Problem**: Authentication header not being sent properly when session is null

**Solution**:
1. Add better session validation before calling LinkedIn API
2. Add retry logic with session refresh
3. Improve error handling for unauthorized responses

**Files to Modify**:
- `src/components/profile/LinkedInConnect.tsx`

**Technical Changes**:
```typescript
const handleConnect = async () => {
  setIsLoading(true);
  setError(null);
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      toast.error('Please refresh the page and try again');
      return;
    }
    // ... rest of the flow
  }
}
```

---

### Phase 3: Google Sign-in Fix

**Problem**: OAuth callback may not be setting session properly

**Solution**:
1. Add explicit session handling after OAuth redirect
2. Check for hash parameters on /feed route for OAuth callback
3. Add session restoration logic

**Files to Modify**:
- `src/contexts/AuthContext.tsx`
- `src/pages/Feed.tsx` (add OAuth callback detection)

**Technical Changes**:
In `Feed.tsx`, add effect to check for OAuth return:
```typescript
useEffect(() => {
  // Check if returning from OAuth
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  if (hashParams.get('access_token')) {
    // Let AuthContext handle the session
    window.history.replaceState({}, '', window.location.pathname);
  }
}, []);
```

---

### Phase 4: Public Profile Enhancements

**Problem**: Bio truncation without "See more", missing sections

**Solution**:
1. Add "See more/less" toggle for bio
2. Add Experience, Education, Certifications sections
3. Check privacy settings before showing sections
4. Add Follow/Message buttons for non-own profiles

**Files to Modify**:
- `src/pages/PublicProfile.tsx`

**Technical Changes**:
```typescript
// Add state for bio expansion
const [bioExpanded, setBioExpanded] = useState(false);

// Bio with See more
{profile.bio && (
  <div>
    <p className={`text-sm text-muted-foreground ${bioExpanded ? '' : 'line-clamp-3'}`}>
      {profile.bio}
    </p>
    {profile.bio.length > 150 && (
      <button 
        onClick={() => setBioExpanded(!bioExpanded)}
        className="text-primary text-sm mt-1"
      >
        {bioExpanded ? 'See less' : 'See more'}
      </button>
    )}
  </div>
)}

// Add sections with privacy checks
{profile.privacy_experience !== false && (
  <ExperienceSection userId={profile.id} isPublicView={true} />
)}
```

---

### Phase 5: Search Navigation Fix

**Problem**: Navigates to `/profile/${username}` instead of `/u/${username}`

**Solution**:
1. Update `SearchTypeahead.tsx` to navigate to public profile route
2. This allows logged-out users to view profiles too

**Files to Modify**:
- `src/components/search/SearchTypeahead.tsx`

**Technical Changes**:
```typescript
const handleUserClick = (username: string | null) => {
  if (username) {
    navigate(`/u/${username}`);  // Changed from /profile/
    onResultClick();
  }
};
```

---

### Phase 6: Follow & Message Flow (New Feature)

**Problem**: Need Follow button with states + Messaging with credential blocking

**Solution**:

#### A. Enhance Public Profile with Follow/Message buttons
**Files to Modify**:
- `src/pages/PublicProfile.tsx`

Add:
```typescript
// Import hooks
import { useToggleFollow, useIsFollowing } from '@/hooks/useFollows';

// Check follow status
const { data: isFollowing, isLoading: followLoading } = useIsFollowing(profile?.id);
const toggleFollow = useToggleFollow();

// Follow button with confirmation modal for unfollow
<Button
  onClick={handleFollowClick}
  variant={isFollowing ? 'outline' : 'default'}
>
  {isFollowing ? 'Following' : 'Follow'}
</Button>
```

#### B. Create Unfollow Confirmation Modal
**Files to Create**:
- `src/components/profile/UnfollowConfirmModal.tsx`

```typescript
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  username: string;
}

export const UnfollowConfirmModal = ({ isOpen, onClose, onConfirm, username }) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent>
      <DialogTitle>Unfollow {username}?</DialogTitle>
      <DialogDescription>
        Are you sure you want to unfollow this user?
      </DialogDescription>
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="destructive" onClick={onConfirm}>Unfollow</Button>
      </div>
    </DialogContent>
  </Dialog>
);
```

#### C. Messaging with Credential Blocking
**Files to Modify**:
- Create `src/hooks/useSendMessage.ts`
- Update `src/pages/MessagesNew.tsx`

**Credential Detection**:
```typescript
const CREDENTIAL_PATTERNS = [
  /password[\s:=]+\S+/i,
  /pwd[\s:=]+\S+/i,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,  // Email
  /\b\d{10,}\b/,  // Phone
  /api[_-]?key[\s:=]+\S+/i,
  /secret[\s:=]+\S+/i,
  /token[\s:=]+\S+/i,
];

const containsCredentials = (message: string): boolean => {
  return CREDENTIAL_PATTERNS.some(pattern => pattern.test(message));
};

// In send message handler:
if (containsCredentials(message)) {
  toast.error('Message cannot contain sensitive information like passwords or credentials');
  return;
}
```

#### D. Follow Requirement for Messaging
**Logic**: Only allow P1 to message P2 if P1 follows P2

```typescript
// In MessagesNew.tsx startConversation:
const { data: isFollowing } = await supabase
  .from('follows')
  .select('id')
  .eq('follower_id', user.id)
  .eq('following_id', targetUserId)
  .single();

if (!isFollowing) {
  toast.error('You need to follow this user before messaging');
  return;
}
```

---

### Phase 7: News Cron Job Setup

**Problem**: News is stale - needs automatic refresh every 5 minutes

**Solution**:
Enable pg_cron and pg_net extensions, then create scheduled job

**Database Migration**:
```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule news fetch every 5 minutes
SELECT cron.schedule(
  'fetch-google-rss-news',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://mgjxxihralfncarbuvqs.supabase.co/functions/v1/fetch-google-rss',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

---

### Phase 8: Feed News Data Flow Fix

**Problem**: Trending tab not showing news articles

**Solution**:
1. Verify `TrendingStructuredFeed` receives news articles from parent
2. Ensure `useNews` hook fetches from correct endpoint

**Files to Check/Modify**:
- `src/pages/Feed.tsx` - Verify news is passed to TrendingStructuredFeed
- `src/components/feed/TrendingStructuredFeed.tsx`
- `src/hooks/useNews.ts`

---

## File Change Summary

| Priority | File | Change Type | Description |
|----------|------|-------------|-------------|
| 1 | `MobileVerificationModal.tsx` | Modify | Handle `smsSent: false` gracefully |
| 2 | `LinkedInConnect.tsx` | Modify | Better session validation |
| 3 | `AuthContext.tsx` | Modify | OAuth callback session handling |
| 4 | `PublicProfile.tsx` | Modify | Add See more, sections, Follow/Message |
| 5 | `SearchTypeahead.tsx` | Modify | Change navigation to `/u/:username` |
| 6 | `UnfollowConfirmModal.tsx` | Create | Confirmation for unfollow |
| 7 | `useSendMessage.ts` | Create | Message sending with credential check |
| 8 | Database Migration | Create | Cron job for news refresh |

---

## Testing Checklist

- [ ] Mobile OTP: Enter number -> See dev OTP -> Verify successfully
- [ ] LinkedIn: Click Connect -> OAuth popup -> Returns Connected
- [ ] Google: Click Continue with Google -> Lands on /feed logged in
- [ ] Public Profile: See full bio with "See more", Experience/Education if enabled
- [ ] Search: Click user -> Navigate to `/u/:username`
- [ ] Follow: Button shows "Follow" -> Click -> Shows "Following"
- [ ] Unfollow: Click "Following" -> Confirmation modal -> Unfollow
- [ ] Message: Can only message users you follow
- [ ] Message: Blocked if contains password/credential
- [ ] Trending: Shows fresh news (less than 24h old)
- [ ] Markets: Shows real stock data for NIFTY50, SENSEX, etc.

---

## Important Notes

1. **Twilio Trial Limitation**: For production SMS, upgrade to paid Twilio account or switch provider
2. **LinkedIn OAuth**: Ensure redirect URIs are registered in LinkedIn Developer Console
3. **News Freshness**: Cron job must be running for fresh news
4. **Market Data**: TwelveData and Finnhub APIs are working; ensure API keys have quota

