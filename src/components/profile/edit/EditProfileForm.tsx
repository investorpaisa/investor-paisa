import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/hooks/useUserData';
import { ProfileData } from '@/types/profile';

import { ProfilePictureSection } from './ProfilePictureSection';
import { BasicInfoSection } from './BasicInfoSection';
import { ProfessionalInfoSection } from './ProfessionalInfoSection';
import { InterestsSection } from './InterestsSection';

interface EditProfileFormProps {
  profileData: ProfileData | null;
  refreshProfile: (updatedData: Partial<ProfileData>) => void;
}

export const EditProfileForm = ({ profileData, refreshProfile }: EditProfileFormProps) => {
  const navigate = useNavigate();
  const { updateProfile } = useAuth();
  const userData = useUserData();
  
  // Form state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [username, setUsername] = useState('');
  const [career, setCareer] = useState('');
  const [education, setEducation] = useState('');
  const [certifications, setCertifications] = useState('');
  const [achievements, setAchievements] = useState('');
  const [location, setLocation] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Financial categories for interests
  const financialCategories = [
    'Stocks', 'Mutual Funds', 'Bonds', 'ETFs', 'Real Estate', 
    'Tax Planning', 'Retirement', 'Insurance', 'Cryptocurrency',
    'Financial Planning', 'Budgeting', 'Debt Management'
  ];

  // Load profile data when component mounts
  useEffect(() => {
    if (profileData) {
      setName(profileData.name || '');
      setBio(profileData.bio || '');
      setUsername(profileData.username || '');
      setCareer(profileData.career || '');
      setEducation(profileData.education || '');
      setCertifications(profileData.certifications || '');
      setAchievements(profileData.achievements || '');
      setLocation(profileData.location || '');
      setInterests(profileData.interests || []);
    }
  }, [profileData]);

  // Function to handle profile update
  const handleUpdateProfile = async () => {
    try {
      setIsSubmitting(true);
      
      // Create updated profile object
      const updatedProfile = {
        full_name: name,
        bio,
        username
      };
      
      // Update profile in Supabase
      await updateProfile(updatedProfile);
      
      toast.success('Profile updated successfully');
      
      // Refresh profile data
      if (refreshProfile) {
        refreshProfile({
          name,
          bio,
          username,
          career,
          education,
          certifications,
          achievements,
          location,
          interests
        });
      }
      
      setIsSubmitting(false);
      navigate('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Public Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Picture */}
        <ProfilePictureSection 
          avatar={userData?.avatar} 
          name={name} 
        />

        {/* Basic Info */}
        <BasicInfoSection 
          name={name} 
          setName={setName} 
          username={username} 
          setUsername={setUsername} 
          bio={bio} 
          setBio={setBio} 
        />

        <Separator />

        {/* Professional Info */}
        <ProfessionalInfoSection 
          career={career}
          setCareer={setCareer}
          education={education}
          setEducation={setEducation}
          certifications={certifications}
          setCertifications={setCertifications}
          achievements={achievements}
          setAchievements={setAchievements}
          location={location}
          setLocation={setLocation}
        />

        <Separator />

        {/* Interests and Expertise */}
        <InterestsSection 
          interests={interests} 
          onUpdate={setInterests}
        />
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => navigate('/profile')}>
          Cancel
        </Button>
        <Button onClick={handleUpdateProfile} disabled={isSubmitting}>
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardFooter>
    </Card>
  );
};
