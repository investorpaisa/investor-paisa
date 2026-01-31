import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  User, Mail, Phone, MapPin, Building, Calendar, 
  Globe, Linkedin, Twitter, Plus, X, Edit3, Save,
  Briefcase, GraduationCap, Award, Star, Shield
} from 'lucide-react';
import { LinkedInConnect } from './LinkedInConnect';
import { MobileVerifyButton } from './MobileVerificationModal';

interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
}

interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  grade?: string;
}

interface ProfileEditFormProps {
  profile: any;
  onSave: (updatedProfile: any) => void;
  onCancel: () => void;
}

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({ profile, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    headline: profile?.headline || '',
    bio: profile?.bio || '',
    location: profile?.location || '',
    website: profile?.website || '',
    phone: profile?.phone || '',
    linkedin_url: profile?.linkedin_url || '',
    twitter_url: profile?.twitter_url || '',
    industry: profile?.industry || '',
    company: profile?.company || '',
  });

  const [experiences, setExperiences] = useState<Experience[]>(profile?.experiences || []);
  const [education, setEducation] = useState<Education[]>(profile?.education || []);
  const [skills, setSkills] = useState<string[]>(profile?.skills || []);
  const [newSkill, setNewSkill] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addExperience = () => {
    const newExp: Experience = {
      id: Date.now().toString(),
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    };
    setExperiences(prev => [...prev, newExp]);
  };

  const updateExperience = (id: string, field: string, value: string | boolean) => {
    setExperiences(prev => 
      prev.map(exp => 
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    );
  };

  const removeExperience = (id: string) => {
    setExperiences(prev => prev.filter(exp => exp.id !== id));
  };

  const addEducation = () => {
    const newEdu: Education = {
      id: Date.now().toString(),
      school: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      grade: ''
    };
    setEducation(prev => [...prev, newEdu]);
  };

  const updateEducation = (id: string, field: string, value: string) => {
    setEducation(prev => 
      prev.map(edu => 
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    );
  };

  const removeEducation = (id: string) => {
    setEducation(prev => prev.filter(edu => edu.id !== id));
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills(prev => [...prev, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(prev => prev.filter(s => s !== skill));
  };

  const handleSave = () => {
    const updatedProfile = {
      ...formData,
      experiences,
      education,
      skills
    };
    onSave(updatedProfile);
  };

  return (
    <div className="space-y-8">
      {/* Basic Information */}
      <Card className="rounded-3xl border-0 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-bold text-slate-900">
            <User className="h-5 w-5 mr-2 text-blue-600" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="full_name" className="text-slate-700 font-medium">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                className="rounded-2xl mt-2"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <Label htmlFor="headline" className="text-slate-700 font-medium">Professional Headline</Label>
              <Input
                id="headline"
                value={formData.headline}
                onChange={(e) => handleInputChange('headline', e.target.value)}
                className="rounded-2xl mt-2"
                placeholder="e.g., Senior Financial Advisor at HDFC Bank"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bio" className="text-slate-700 font-medium">About</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              className="rounded-2xl mt-2 min-h-32"
              placeholder="Tell others about yourself, your experience, and what makes you unique..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="location" className="text-slate-700 font-medium">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="rounded-2xl mt-2"
                placeholder="City, Country"
              />
            </div>
            <div>
              <Label htmlFor="industry" className="text-slate-700 font-medium">Industry</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className="rounded-2xl mt-2"
                placeholder="e.g., Financial Services"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="company" className="text-slate-700 font-medium">Current Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="rounded-2xl mt-2"
                placeholder="e.g., HDFC Bank"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-slate-700 font-medium">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="rounded-2xl mt-2"
                placeholder="+91 9876543210"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="website" className="text-slate-700 font-medium">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="rounded-2xl mt-2"
                placeholder="https://your-website.com"
              />
            </div>
            <div>
              <Label htmlFor="linkedin_url" className="text-slate-700 font-medium">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                value={formData.linkedin_url}
                onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                className="rounded-2xl mt-2"
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
            <div>
              <Label htmlFor="twitter_url" className="text-slate-700 font-medium">Twitter URL</Label>
              <Input
                id="twitter_url"
                value={formData.twitter_url}
                onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                className="rounded-2xl mt-2"
                placeholder="https://twitter.com/yourhandle"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Section */}
      <Card className="rounded-3xl border-0 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-bold text-slate-900">
            <Shield className="h-5 w-5 mr-2 text-green-600" />
            Account Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Verify your account to unlock more features and build trust with the community.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700">LinkedIn</span>
              <LinkedInConnect 
                isConnected={profile?.linkedin_verified || false}
                onConnect={() => window.location.reload()}
              />
            </div>
            
            <Separator orientation="vertical" className="h-auto hidden sm:block" />
            
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700">Mobile Number</span>
              <MobileVerifyButton 
                isVerified={profile?.mobile_verified || false}
                onVerify={() => window.location.reload()}
              />
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-2xl p-4 text-sm text-blue-800">
            <strong>Benefits of verification:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Get a verified badge on your profile</li>
              <li>Unlock the ability to post questions and comments</li>
              <li>Build credibility with other community members</li>
              <li>Access to advanced features like brand collaborations</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Experience Section */}
      <Card className="rounded-3xl border-0 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-xl font-bold text-slate-900">
              <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
              Experience
            </CardTitle>
            <Button onClick={addExperience} size="sm" className="rounded-2xl">
              <Plus className="h-4 w-4 mr-2" />
              Add Experience
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {experiences.map((exp) => (
            <div key={exp.id} className="p-6 border border-slate-200 rounded-2xl bg-slate-50/50">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-semibold text-slate-900">Experience Entry</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeExperience(exp.id)}
                  className="text-red-600 hover:bg-red-50 rounded-2xl"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Input
                  value={exp.title}
                  onChange={(e) => updateExperience(exp.id, 'title', e.target.value)}
                  placeholder="Job Title"
                  className="rounded-2xl"
                />
                <Input
                  value={exp.company}
                  onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                  placeholder="Company Name"
                  className="rounded-2xl"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Input
                  value={exp.location}
                  onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                  placeholder="Location"
                  className="rounded-2xl"
                />
                <Input
                  type="month"
                  value={exp.startDate}
                  onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                  placeholder="Start Date"
                  className="rounded-2xl"
                />
                <Input
                  type="month"
                  value={exp.endDate}
                  onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                  placeholder="End Date"
                  className="rounded-2xl"
                  disabled={exp.current}
                />
              </div>
              
              <div className="mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exp.current}
                    onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-700">I currently work here</span>
                </label>
              </div>
              
              <Textarea
                value={exp.description}
                onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                placeholder="Describe your role and achievements..."
                className="rounded-2xl"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Education Section */}
      <Card className="rounded-3xl border-0 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-xl font-bold text-slate-900">
              <GraduationCap className="h-5 w-5 mr-2 text-blue-600" />
              Education
            </CardTitle>
            <Button onClick={addEducation} size="sm" className="rounded-2xl">
              <Plus className="h-4 w-4 mr-2" />
              Add Education
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {education.map((edu) => (
            <div key={edu.id} className="p-6 border border-slate-200 rounded-2xl bg-slate-50/50">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-semibold text-slate-900">Education Entry</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEducation(edu.id)}
                  className="text-red-600 hover:bg-red-50 rounded-2xl"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Input
                  value={edu.school}
                  onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                  placeholder="School/University"
                  className="rounded-2xl"
                />
                <Input
                  value={edu.degree}
                  onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                  placeholder="Degree"
                  className="rounded-2xl"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  value={edu.field}
                  onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
                  placeholder="Field of Study"
                  className="rounded-2xl"
                />
                <Input
                  type="month"
                  value={edu.startDate}
                  onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                  placeholder="Start Date"
                  className="rounded-2xl"
                />
                <Input
                  type="month"
                  value={edu.endDate}
                  onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                  placeholder="End Date"
                  className="rounded-2xl"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Skills Section */}
      <Card className="rounded-3xl border-0 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-bold text-slate-900">
            <Star className="h-5 w-5 mr-2 text-blue-600" />
            Skills & Expertise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {skills.map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1"
              >
                {skill}
                <button
                  onClick={() => removeSkill(skill)}
                  className="ml-2 text-blue-600 hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          
          <div className="flex space-x-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add a skill..."
              className="rounded-2xl"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkill();
                }
              }}
            />
            <Button onClick={addSkill} size="sm" className="rounded-2xl">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={onCancel} className="rounded-2xl">
          Cancel
        </Button>
        <Button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
};
