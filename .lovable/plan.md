
# Edit Profile Page Implementation Plan

## Executive Summary
This plan details the creation of a brand-new Edit Profile page at `/profile/edit` that integrates seamlessly with the existing InvestorPaisa design system. The implementation includes database schema creation for experience, education, certifications, and skills, along with complete frontend UI following the dark theme with teal/cyan accents.

---

## 1. Database Schema Changes

### New Tables Required

Since no tables exist for experience, education, certifications, or skills, we need to create them:

#### 1.1 `user_experiences` Table
```sql
CREATE TABLE public.user_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  start_month INTEGER CHECK (start_month >= 1 AND start_month <= 12),
  start_year INTEGER CHECK (start_year >= 1950 AND start_year <= 2100),
  end_month INTEGER CHECK (end_month >= 1 AND end_month <= 12),
  end_year INTEGER CHECK (end_year >= 1950 AND end_year <= 2100),
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 1.2 `user_educations` Table
```sql
CREATE TABLE public.user_educations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  school TEXT NOT NULL,
  degree TEXT,
  field_of_study TEXT,
  start_month INTEGER,
  start_year INTEGER,
  end_month INTEGER,
  end_year INTEGER,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 1.3 `user_certifications` Table
```sql
CREATE TABLE public.user_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuing_organization TEXT NOT NULL,
  issue_month INTEGER,
  issue_year INTEGER,
  expiry_month INTEGER,
  expiry_year INTEGER,
  no_expiry BOOLEAN DEFAULT false,
  credential_id TEXT,
  credential_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 1.4 `user_skills` Table
```sql
CREATE TABLE public.user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, skill_name)
);
```

#### 1.5 `skill_suggestions` Table (for autocomplete)
```sql
CREATE TABLE public.skill_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  usage_count INTEGER DEFAULT 0,
  category TEXT
);
```

#### 1.6 Profile Table Updates
Add new columns to profiles table:
```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT;
```

### RLS Policies
- Users can only CRUD their own records
- SELECT policies for public visibility of verified profiles
- Strict INSERT/UPDATE/DELETE policies checking `auth.uid() = user_id`

---

## 2. Route Configuration

### Current State
- Route exists at `/edit-profile` pointing to `EditProfile.tsx`
- Dropdown menu in Profile page navigates to `/edit-profile`

### Changes Required
- Update route from `/edit-profile` to `/profile/edit` in `App.tsx`
- Update navigation link in `Profile.tsx` dropdown from `/edit-profile` to `/profile/edit`

---

## 3. Page Structure & UI Components

### File Structure
```
src/
├── pages/
│   └── ProfileEdit.tsx (renamed from EditProfile.tsx)
├── components/
│   └── profile/
│       └── edit/
│           ├── EditProfilePage.tsx (main container)
│           ├── ProfileCompletionRing.tsx
│           ├── IdentitySection.tsx
│           ├── ContactVerificationSection.tsx
│           ├── SocialProfilesSection.tsx
│           ├── ExperienceSection.tsx
│           ├── EducationSection.tsx
│           ├── SkillsSection.tsx
│           ├── CertificationsSection.tsx
│           └── StickyBottomBar.tsx
├── hooks/
│   └── useEditProfile.ts (data fetching and mutation)
```

### Design Specifications

#### Theme Adherence
Following the design system memory:
- Dark theme with monochromatic black base (`bg-background`)
- Primary accent: Teal/Cyan (`#0ABAB5` / `hsl(174 100% 36%)`)
- Glass morphism cards: `glass` utility class
- Curved corners: `rounded-2xl` or `rounded-3xl`
- No violet/purple colors

#### Section Cards
Each section will be a glass card:
```jsx
<Card className="glass border-border/50 rounded-2xl">
  <CardHeader className="pb-2">
    <CardTitle className="flex items-center text-lg font-semibold">
      <Icon className="h-5 w-5 mr-2 text-primary" />
      Section Title
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* Form fields */}
  </CardContent>
</Card>
```

---

## 4. Section-by-Section Implementation

### 4.1 Profile Completion Ring (Top)
**Location:** Top of page, before all sections
**Features:**
- Circular progress ring showing percentage
- Breakdown of completion criteria
- Points system matching existing `compute_profile_completeness` trigger

**Completion Criteria (matching existing DB function):**
| Field | Points |
|-------|--------|
| Full Name | 10 |
| Bio | 5 |
| Headline | 10 |
| Location | 10 |
| Avatar | 10 |
| Interests (1+) | 10 |
| Goals (1+) | 10 |
| Mobile Verified | 20 |
| LinkedIn Verified | 15 |

**Additional criteria to add:**
| Field | Points |
|-------|--------|
| Experience (1+) | 10 |
| Education (1+) | 10 |
| Skills (3+) | 10 |
| Certification (1+) | 10 |

### 4.2 Identity Section
**Fields:**
- Username (read-only, greyed out with `@` prefix)
- Full Name (editable, floating label input)
- Email (read-only, greyed out)

**Validation:**
- Full Name: 2-60 characters

### 4.3 Contact & Verification Section
**Mobile Number:**
- Country code selector + phone input
- "Verify" button triggering OTP flow
- Existing `MobileVerificationModal` component reused
- Green checkmark badge when verified

**Verification Flow (existing implementation):**
1. User enters phone → POST to `auth-mobile-request-otp`
2. OTP modal appears
3. User enters 6-digit OTP → POST to `auth-mobile-verify-otp`
4. On success: `mobile_verified = true` in profiles

**Change Number Logic:**
- If phone number changes, `mobile_verified` resets to `false`

### 4.4 Social Profiles Section
**Fields:**
- LinkedIn URL + Verify button (existing `LinkedInConnect` component)
- X (Twitter) URL (input only, no verification)
- Instagram URL (input only, no verification)

**LinkedIn Verification:**
- Uses existing `auth-linkedin-connect` edge function
- On success: stores `linkedin_id`, sets `linkedin_verified = true`

### 4.5 Experience Section
**Layout:** Collapsible list of experience cards

**Each Experience Block Fields:**
- Job Title (required)
- Company Name (required)
- Location
- From: Month/Year dropdowns
- To: Month/Year dropdowns (disabled if "current")
- "I currently work here" checkbox
- Description (multiline)

**Actions:**
- Add Experience button
- Edit icon per entry
- Delete icon per entry with confirmation

**Collapsed State:** Show title + company + dates

### 4.6 Education Section
**Same pattern as Experience**

**Fields:**
- School/University (required)
- Degree
- Field of Study
- From: Month/Year
- To: Month/Year
- "I am currently studying" checkbox
- Description

### 4.7 Skills & Expertise Section
**UI:** Chip input with autocomplete

**Behavior:**
- Type → suggestions appear from `skill_suggestions` table
- Press Enter → chip added
- Click X on chip → remove
- Max 20 skills

**Autocomplete Endpoint:**
Query `skill_suggestions` table with `ILIKE` search

### 4.8 Certifications Section
**Fields:**
- Certification Name (required)
- Issuing Organization (required)
- Issue Month/Year
- Expiry Month/Year (disabled if no expiry)
- "Doesn't expire" checkbox
- Credential ID
- Credential URL

---

## 5. Save Model

### No Autosave
- All changes tracked in local state
- Dirty state detection for unsaved changes warning

### Sticky Bottom Bar
```jsx
<div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/50 p-4 z-50">
  <div className="max-w-2xl mx-auto flex justify-end gap-3">
    <Button variant="outline" onClick={handleCancel}>Cancel</Button>
    <Button onClick={handleSave} disabled={isSaving} className="bg-primary">
      <Save className="h-4 w-4 mr-2" />
      {isSaving ? 'Saving...' : 'Save Changes'}
    </Button>
  </div>
</div>
```

### Batch Update Logic
On save:
1. Update `profiles` table (name, bio, location, headline, phone, social URLs)
2. Upsert experiences (insert new, update modified, delete removed)
3. Upsert educations
4. Upsert skills
5. Upsert certifications
6. Refresh profile in AuthContext
7. Show success toast
8. Navigate to `/profile`

---

## 6. Data Validation

### Client-Side (Zod Schemas)
```typescript
const profileSchema = z.object({
  full_name: z.string().min(2).max(60),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/).optional().or(z.literal('')),
  linkedin_url: z.string().url().startsWith('http').optional().or(z.literal('')),
  twitter_url: z.string().url().startsWith('http').optional().or(z.literal('')),
  instagram_url: z.string().url().startsWith('http').optional().or(z.literal('')),
});
```

### Error Display
- Inline error messages below each field
- Red border on invalid fields
- No blocking modals

---

## 7. Mobile Design

### Layout Adjustments
- Single column layout
- Same paddings as feed cards (`px-2`)
- Full-width inputs
- Sticky save bar at bottom with safe area padding

### Touch Optimization
- Larger touch targets (min 44x44px)
- Collapsible sections default collapsed
- Smooth scroll to sections

---

## 8. Analytics Events

### New Events to Track
```typescript
export const trackProfileEvents = {
  editProfileOpen: () => trackEvent('edit_profile_open', 'profile'),
  mobileVerifyStart: () => trackEvent('mobile_verify_start', 'verification'),
  mobileVerifySuccess: () => trackEvent('mobile_verify_success', 'verification'),
  linkedinConnect: () => trackEvent('linkedin_connect', 'verification'),
  profileSave: () => trackEvent('profile_save', 'profile'),
};
```

---

## 9. Performance Requirements

### Target: <600ms Page Load
Strategies:
- Lazy load section components
- Parallel data fetching for experiences, education, skills, certifications
- Skeleton loaders during fetch
- React Query caching

---

## 10. Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `src/pages/ProfileEdit.tsx` | New page component (replaces EditProfile.tsx) |
| `src/components/profile/edit/EditProfilePage.tsx` | Main container with all sections |
| `src/components/profile/edit/ProfileCompletionRing.tsx` | Circular progress indicator |
| `src/components/profile/edit/IdentitySection.tsx` | Username, name, email |
| `src/components/profile/edit/ContactVerificationSection.tsx` | Phone + verification |
| `src/components/profile/edit/SocialProfilesSection.tsx` | LinkedIn, Twitter, Instagram |
| `src/components/profile/edit/ExperienceSection.tsx` | Work history |
| `src/components/profile/edit/EducationSection.tsx` | Education history |
| `src/components/profile/edit/SkillsSection.tsx` | Skills chip input |
| `src/components/profile/edit/CertificationsSection.tsx` | Certifications list |
| `src/components/profile/edit/StickyBottomBar.tsx` | Save/Cancel bar |
| `src/hooks/useEditProfile.ts` | Data fetching and mutations |

### Modified Files
| File | Changes |
|------|---------|
| `src/App.tsx` | Update route from `/edit-profile` to `/profile/edit` |
| `src/pages/Profile.tsx` | Update dropdown navigation link |
| `src/services/analytics/googleAnalytics.ts` | Add new tracking events |

### Files to Delete
| File | Reason |
|------|--------|
| `src/pages/EditProfile.tsx` | Replaced by ProfileEdit.tsx |
| `src/components/profile/edit/EditProfileForm.tsx` | Replaced by new section components |
| `src/components/profile/ProfileEditForm.tsx` | Legacy component, replaced |

---

## 11. Database Migration

### Migration SQL
```sql
-- User Experiences
CREATE TABLE public.user_experiences (...);
ALTER TABLE public.user_experiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own experiences" ON public.user_experiences 
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own experiences" ON public.user_experiences 
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own experiences" ON public.user_experiences 
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own experiences" ON public.user_experiences 
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Similar for user_educations, user_certifications, user_skills
-- Profile columns addition
-- Skill suggestions seed data
```

---

## 12. Test Account Seeding

### Test Users Data
```sql
-- Seed test users with different verification states
-- uv1@investorpaisa.com, uv2@investorpaisa.com (unverified)
-- v1@investorpaisa.com, v2@investorpaisa.com (verified)
-- inf1@investorpaisa.com, inf2@investorpaisa.com (influencer tier)
-- exp1@investorpaisa.com, exp2@investorpaisa.com (expert tier)
```

Note: Test account creation requires password setting which cannot be done via SQL migration. These would need to be created through the auth signup flow.

---

## 13. Implementation Order

### Phase 1: Database
1. Create migration for new tables
2. Add RLS policies
3. Update `compute_profile_completeness` function

### Phase 2: Core Infrastructure
1. Create `useEditProfile` hook
2. Create `ProfileEdit.tsx` page
3. Update routing

### Phase 3: UI Components
1. Create section components in order:
   - IdentitySection
   - ContactVerificationSection
   - SocialProfilesSection
   - ExperienceSection
   - EducationSection
   - SkillsSection
   - CertificationsSection
2. Create ProfileCompletionRing
3. Create StickyBottomBar

### Phase 4: Integration
1. Wire up save logic
2. Add analytics events
3. Mobile responsive testing
4. Performance optimization

### Phase 5: Cleanup
1. Delete legacy files
2. Update Profile page navigation
3. Final QA checklist verification

---

## 14. Notes on Firebase

The request mentions Firebase Phone Auth. However, the existing implementation uses a custom OTP system via edge functions (`auth-mobile-request-otp`, `auth-mobile-verify-otp`) that stores OTPs in the `mobile_otp_requests` table.

**Recommendation:** Continue using the existing OTP system rather than introducing Firebase Phone Auth, because:
1. The infrastructure already exists and works
2. Adding Firebase Phone Auth would require additional configuration and billing
3. The current system integrates seamlessly with the Supabase backend

If Firebase Phone Auth is specifically required, that would need:
- Firebase project configuration in Lovable secrets
- SMS sending via Firebase Console
- Verification state sync back to Supabase profiles

---

## 15. QA Checklist

- [ ] Can open edit profile from Profile page 3-dot menu
- [ ] Username displays as read-only with @ prefix
- [ ] Can change full name (2-60 chars validation)
- [ ] Email displays as read-only
- [ ] Can enter phone number and trigger OTP verification
- [ ] OTP modal appears and verification works
- [ ] Verified badge appears after successful verification
- [ ] Can connect LinkedIn (existing flow works)
- [ ] Can add Twitter/Instagram URLs
- [ ] Can add/edit/delete experience entries
- [ ] Can add/edit/delete education entries
- [ ] Can add skills with autocomplete (max 20)
- [ ] Can add/edit/delete certifications
- [ ] Profile completion percentage updates correctly
- [ ] Save button triggers batch update
- [ ] Success toast appears after save
- [ ] Data persists after page refresh
- [ ] Mobile layout is single-column and responsive
- [ ] No other pages are affected
- [ ] Analytics events fire correctly
- [ ] Page loads in <600ms
