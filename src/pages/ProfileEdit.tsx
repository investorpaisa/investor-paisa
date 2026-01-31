import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useEditProfile } from '@/hooks/useEditProfile';
import { ProfileCompletionRing } from '@/components/profile/edit/ProfileCompletionRing';
import { IdentitySection } from '@/components/profile/edit/IdentitySection';
import { ContactVerificationSection } from '@/components/profile/edit/ContactVerificationSection';
import { SocialProfilesSection } from '@/components/profile/edit/SocialProfilesSection';
import { ExperienceSection } from '@/components/profile/edit/ExperienceSection';
import { EducationSection } from '@/components/profile/edit/EducationSection';
import { SkillsSection } from '@/components/profile/edit/SkillsSection';
import { CertificationsSection } from '@/components/profile/edit/CertificationsSection';
import { StickyBottomBar } from '@/components/profile/edit/StickyBottomBar';
import { trackEvent } from '@/services/analytics/googleAnalytics';

const ProfileEdit = () => {
  const navigate = useNavigate();
  const {
    profile,
    experiences,
    educations,
    certifications,
    skills,
    isLoading,
    isSaving,
    isDirty,
    updateProfile,
    updateExperiences,
    updateEducations,
    updateCertifications,
    updateSkills,
    save,
    user,
    authProfile,
  } = useEditProfile();

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Track page view
  useEffect(() => {
    trackEvent('edit_profile_open', 'profile');
  }, []);

  // Validate before save
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!profile.full_name || profile.full_name.trim().length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters';
    } else if (profile.full_name.trim().length > 60) {
      newErrors.full_name = 'Full name must be 60 characters or less';
    }

    if (profile.linkedin_url && !profile.linkedin_url.startsWith('http')) {
      newErrors.linkedin_url = 'URL must start with http';
    }

    if (profile.twitter_url && !profile.twitter_url.startsWith('http')) {
      newErrors.twitter_url = 'URL must start with http';
    }

    if (profile.instagram_url && !profile.instagram_url.startsWith('http')) {
      newErrors.instagram_url = 'URL must start with http';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    
    trackEvent('profile_save', 'profile');
    save(undefined, {
      onSuccess: () => {
        navigate('/profile');
      },
    });
  };

  const handleCancel = () => {
    if (isDirty) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        return;
      }
    }
    navigate('/profile');
  };

  const handleMobileVerified = () => {
    trackEvent('mobile_verify_success', 'verification');
  };

  const handleLinkedInConnected = () => {
    trackEvent('linkedin_connect', 'verification');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="max-w-2xl mx-auto py-4 px-2 sm:px-4 space-y-4">
          <div className="flex items-center space-x-4 mb-6">
            <Skeleton className="h-10 w-20" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-60" />
            </div>
          </div>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const username = authProfile?.username || user?.email?.split('@')[0] || 'user';
  const email = user?.email || '';

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-2xl mx-auto py-4 px-2 sm:px-4 space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="rounded-xl h-9"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Edit Profile</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Update your professional information
            </p>
          </div>
        </div>

        {/* Profile Completion Ring */}
        <ProfileCompletionRing
          profile={{
            full_name: profile.full_name,
            bio: profile.bio,
            headline: profile.headline,
            location: profile.location,
            avatar_url: authProfile?.avatar_url,
            interests: authProfile?.interests || [],
            goals: authProfile?.goals || [],
            mobile_verified: authProfile?.mobile_verified,
            linkedin_verified: authProfile?.linkedin_verified,
          }}
          experienceCount={experiences.filter(e => !e._isDeleted).length}
          educationCount={educations.filter(e => !e._isDeleted).length}
          skillCount={skills.length}
          certificationCount={certifications.filter(c => !c._isDeleted).length}
        />

        {/* Identity Section */}
        <IdentitySection
          username={username}
          email={email}
          profile={profile}
          onUpdate={updateProfile}
          errors={errors}
        />

        {/* Contact & Verification */}
        <ContactVerificationSection
          profile={profile}
          mobileVerified={authProfile?.mobile_verified || false}
          onUpdate={updateProfile}
          onMobileVerified={handleMobileVerified}
        />

        {/* Social Profiles */}
        <SocialProfilesSection
          profile={profile}
          linkedinVerified={authProfile?.linkedin_verified || false}
          onUpdate={updateProfile}
          onLinkedInConnected={handleLinkedInConnected}
          errors={errors}
        />

        {/* Experience */}
        <ExperienceSection
          experiences={experiences}
          onUpdate={updateExperiences}
        />

        {/* Education */}
        <EducationSection
          educations={educations}
          onUpdate={updateEducations}
        />

        {/* Skills */}
        <SkillsSection
          skills={skills}
          onUpdate={updateSkills}
        />

        {/* Certifications */}
        <CertificationsSection
          certifications={certifications}
          onUpdate={updateCertifications}
        />
      </div>

      {/* Sticky Save Bar */}
      <StickyBottomBar
        onSave={handleSave}
        onCancel={handleCancel}
        isSaving={isSaving}
        isDirty={isDirty}
      />
    </div>
  );
};

export default ProfileEdit;
