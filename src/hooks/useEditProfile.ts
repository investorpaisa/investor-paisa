import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Types for edit profile data
export interface Experience {
  id?: string;
  user_id?: string;
  title: string;
  company: string;
  location?: string;
  start_month?: number;
  start_year?: number;
  end_month?: number;
  end_year?: number;
  is_current?: boolean;
  description?: string;
  _isNew?: boolean;
  _isDeleted?: boolean;
}

export interface Education {
  id?: string;
  user_id?: string;
  school: string;
  degree?: string;
  field_of_study?: string;
  start_month?: number;
  start_year?: number;
  end_month?: number;
  end_year?: number;
  is_current?: boolean;
  description?: string;
  _isNew?: boolean;
  _isDeleted?: boolean;
}

export interface Certification {
  id?: string;
  user_id?: string;
  name: string;
  issuing_organization: string;
  issue_month?: number;
  issue_year?: number;
  expiry_month?: number;
  expiry_year?: number;
  no_expiry?: boolean;
  credential_id?: string;
  credential_url?: string;
  _isNew?: boolean;
  _isDeleted?: boolean;
}

export interface ProfileFormData {
  full_name: string;
  headline?: string;
  bio?: string;
  location?: string;
  phone?: string;
  linkedin_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  goals?: string[];
  privacy_experience?: boolean;
  privacy_education?: boolean;
  privacy_certifications?: boolean;
  privacy_skills?: boolean;
  privacy_interests?: boolean;
}

export interface EditProfileState {
  profile: ProfileFormData;
  experiences: Experience[];
  educations: Education[];
  certifications: Certification[];
  skills: string[];
  goals: string[];
  interests: string[];
  isDirty: boolean;
}

export function useEditProfile() {
  const { user, profile: authProfile } = useAuth();
  const queryClient = useQueryClient();
  
  const [state, setState] = useState<EditProfileState>({
    profile: {
      full_name: '',
      headline: '',
      bio: '',
      location: '',
      phone: '',
      linkedin_url: '',
      twitter_url: '',
      instagram_url: '',
      goals: [],
      privacy_experience: true,
      privacy_education: true,
      privacy_certifications: true,
      privacy_skills: true,
      privacy_interests: true,
    },
    experiences: [],
    educations: [],
    certifications: [],
    skills: [],
    goals: [],
    interests: [],
    isDirty: false,
  });

  // Fetch profile data
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['edit-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch experiences
  const { data: experiencesData, isLoading: experiencesLoading } = useQuery({
    queryKey: ['user-experiences', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_experiences')
        .select('*')
        .eq('user_id', user.id)
        .order('start_year', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch educations
  const { data: educationsData, isLoading: educationsLoading } = useQuery({
    queryKey: ['user-educations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_educations')
        .select('*')
        .eq('user_id', user.id)
        .order('start_year', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch certifications
  const { data: certificationsData, isLoading: certificationsLoading } = useQuery({
    queryKey: ['user-certifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_certifications')
        .select('*')
        .eq('user_id', user.id)
        .order('issue_year', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch skills
  const { data: skillsData, isLoading: skillsLoading } = useQuery({
    queryKey: ['user-skills', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_skills')
        .select('skill_name')
        .eq('user_id', user.id);
      if (error) throw error;
      return (data || []).map(s => s.skill_name);
    },
    enabled: !!user?.id,
  });

  // Initialize state from fetched data
  useEffect(() => {
    if (profileData) {
      setState(prev => ({
        ...prev,
        profile: {
          full_name: profileData.full_name || '',
          headline: profileData.headline || '',
          bio: profileData.bio || '',
          location: profileData.location || '',
          phone: (profileData as any).phone || '',
          linkedin_url: (profileData as any).linkedin_url || '',
          twitter_url: (profileData as any).twitter_url || '',
          instagram_url: (profileData as any).instagram_url || '',
          goals: (profileData as any).goals || [],
          privacy_experience: (profileData as any).privacy_experience !== false,
          privacy_education: (profileData as any).privacy_education !== false,
          privacy_certifications: (profileData as any).privacy_certifications !== false,
          privacy_skills: (profileData as any).privacy_skills !== false,
          privacy_interests: (profileData as any).privacy_interests !== false,
        },
        goals: (profileData as any).goals || [],
        interests: (profileData as any).interests || [],
        isDirty: false,
      }));
    }
  }, [profileData]);

  useEffect(() => {
    if (experiencesData) {
      setState(prev => ({ ...prev, experiences: experiencesData, isDirty: false }));
    }
  }, [experiencesData]);

  useEffect(() => {
    if (educationsData) {
      setState(prev => ({ ...prev, educations: educationsData, isDirty: false }));
    }
  }, [educationsData]);

  useEffect(() => {
    if (certificationsData) {
      setState(prev => ({ ...prev, certifications: certificationsData, isDirty: false }));
    }
  }, [certificationsData]);

  useEffect(() => {
    if (skillsData) {
      setState(prev => ({ ...prev, skills: skillsData, isDirty: false }));
    }
  }, [skillsData]);

  // Update handlers
  const updateProfile = useCallback((updates: Partial<ProfileFormData>) => {
    setState(prev => ({
      ...prev,
      profile: { ...prev.profile, ...updates },
      isDirty: true,
    }));
  }, []);

  const updateExperiences = useCallback((experiences: Experience[]) => {
    setState(prev => ({ ...prev, experiences, isDirty: true }));
  }, []);

  const updateEducations = useCallback((educations: Education[]) => {
    setState(prev => ({ ...prev, educations, isDirty: true }));
  }, []);

  const updateCertifications = useCallback((certifications: Certification[]) => {
    setState(prev => ({ ...prev, certifications, isDirty: true }));
  }, []);

  const updateSkills = useCallback((skills: string[]) => {
    setState(prev => ({ ...prev, skills, isDirty: true }));
  }, []);

  const updateGoals = useCallback((goals: string[]) => {
    setState(prev => ({ 
      ...prev, 
      goals, 
      profile: { ...prev.profile, goals },
      isDirty: true 
    }));
  }, []);

  const updateInterests = useCallback((interests: string[]) => {
    setState(prev => ({ ...prev, interests, isDirty: true }));
  }, []);
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      // 1. Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: state.profile.full_name,
          headline: state.profile.headline || null,
          bio: state.profile.bio || null,
          location: state.profile.location || null,
          phone: state.profile.phone || null,
          linkedin_url: state.profile.linkedin_url || null,
          twitter_url: state.profile.twitter_url || null,
          instagram_url: state.profile.instagram_url || null,
          goals: state.goals.length > 0 ? state.goals : null,
          interests: state.interests.length > 0 ? state.interests : null,
          privacy_experience: state.profile.privacy_experience,
          privacy_education: state.profile.privacy_education,
          privacy_certifications: state.profile.privacy_certifications,
          privacy_skills: state.profile.privacy_skills,
          privacy_interests: state.profile.privacy_interests,
        } as any)
        .eq('id', user.id);
      
      if (profileError) throw profileError;

      // 2. Handle experiences - delete, update, insert
      const experiencesToDelete = state.experiences.filter(e => e._isDeleted && e.id);
      const experiencesToInsert = state.experiences.filter(e => e._isNew && !e._isDeleted);
      const experiencesToUpdate = state.experiences.filter(e => !e._isNew && !e._isDeleted && e.id);

      if (experiencesToDelete.length > 0) {
        const { error } = await supabase
          .from('user_experiences')
          .delete()
          .in('id', experiencesToDelete.map(e => e.id!));
        if (error) throw error;
      }

      for (const exp of experiencesToInsert) {
        const { _isNew, _isDeleted, id, ...data } = exp;
        const { error } = await supabase
          .from('user_experiences')
          .insert({ ...data, user_id: user.id });
        if (error) throw error;
      }

      for (const exp of experiencesToUpdate) {
        const { _isNew, _isDeleted, id, user_id, ...data } = exp;
        const { error } = await supabase
          .from('user_experiences')
          .update(data)
          .eq('id', id!);
        if (error) throw error;
      }

      // 3. Handle educations
      const educationsToDelete = state.educations.filter(e => e._isDeleted && e.id);
      const educationsToInsert = state.educations.filter(e => e._isNew && !e._isDeleted);
      const educationsToUpdate = state.educations.filter(e => !e._isNew && !e._isDeleted && e.id);

      if (educationsToDelete.length > 0) {
        const { error } = await supabase
          .from('user_educations')
          .delete()
          .in('id', educationsToDelete.map(e => e.id!));
        if (error) throw error;
      }

      for (const edu of educationsToInsert) {
        const { _isNew, _isDeleted, id, ...data } = edu;
        const { error } = await supabase
          .from('user_educations')
          .insert({ ...data, user_id: user.id });
        if (error) throw error;
      }

      for (const edu of educationsToUpdate) {
        const { _isNew, _isDeleted, id, user_id, ...data } = edu;
        const { error } = await supabase
          .from('user_educations')
          .update(data)
          .eq('id', id!);
        if (error) throw error;
      }

      // 4. Handle certifications
      const certsToDelete = state.certifications.filter(c => c._isDeleted && c.id);
      const certsToInsert = state.certifications.filter(c => c._isNew && !c._isDeleted);
      const certsToUpdate = state.certifications.filter(c => !c._isNew && !c._isDeleted && c.id);

      if (certsToDelete.length > 0) {
        const { error } = await supabase
          .from('user_certifications')
          .delete()
          .in('id', certsToDelete.map(c => c.id!));
        if (error) throw error;
      }

      for (const cert of certsToInsert) {
        const { _isNew, _isDeleted, id, ...data } = cert;
        const { error } = await supabase
          .from('user_certifications')
          .insert({ ...data, user_id: user.id });
        if (error) throw error;
      }

      for (const cert of certsToUpdate) {
        const { _isNew, _isDeleted, id, user_id, ...data } = cert;
        const { error } = await supabase
          .from('user_certifications')
          .update(data)
          .eq('id', id!);
        if (error) throw error;
      }

      // 5. Handle skills - delete all and re-insert
      await supabase.from('user_skills').delete().eq('user_id', user.id);
      
      if (state.skills.length > 0) {
        const { error } = await supabase
          .from('user_skills')
          .insert(state.skills.map(skill => ({ user_id: user.id, skill_name: skill })));
        if (error) throw error;
      }

      return true;
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['edit-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-experiences'] });
      queryClient.invalidateQueries({ queryKey: ['user-educations'] });
      queryClient.invalidateQueries({ queryKey: ['user-certifications'] });
      queryClient.invalidateQueries({ queryKey: ['user-skills'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      setState(prev => ({ ...prev, isDirty: false }));
      toast.success('Profile updated');
    },
    onError: (error: any) => {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save profile');
    },
  });

  const isLoading = profileLoading || experiencesLoading || educationsLoading || certificationsLoading || skillsLoading;

  return {
    ...state,
    isLoading,
    isSaving: saveMutation.isPending,
    updateProfile,
    updateExperiences,
    updateEducations,
    updateCertifications,
    updateSkills,
    updateGoals,
    updateInterests,
    save: saveMutation.mutate,
    user,
    authProfile,
  };
}

// Skill suggestions hook
export function useSkillSuggestions(query: string) {
  return useQuery({
    queryKey: ['skill-suggestions', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      
      const { data, error } = await supabase
        .from('skill_suggestions')
        .select('name')
        .ilike('name', `%${query}%`)
        .limit(10);
      
      if (error) throw error;
      return (data || []).map(s => s.name);
    },
    enabled: query.length >= 2,
    staleTime: 60000,
  });
}
