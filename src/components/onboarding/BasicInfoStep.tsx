import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OnboardingData } from './OnboardingFlow';
import { User, MapPin, Briefcase, ArrowRight, ArrowLeft } from 'lucide-react';

interface BasicInfoStepProps {
  data: Partial<OnboardingData>;
  onComplete: (data: Partial<OnboardingData>) => void;
  onPrevious: () => void;
  showPrevious: boolean;
}

const professions = [
  'Software Engineer', 'Data Scientist', 'Product Manager', 'Designer',
  'Marketing Manager', 'Sales Executive', 'Teacher', 'Doctor',
  'Lawyer', 'Consultant', 'Entrepreneur', 'Student',
  'Financial Analyst', 'Accountant', 'Engineer', 'Other'
];

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  data,
  onComplete,
  onPrevious,
  showPrevious
}) => {
  const [formData, setFormData] = useState({
    full_name: data.full_name || '',
    location: data.location || '',
    profession: data.profession || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    
    if (!formData.profession) {
      newErrors.profession = 'Profession is required';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onComplete(formData);
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <motion.div className="space-y-5" initial="hidden" animate="visible">
        <motion.div variants={itemVariants}>
          <Label htmlFor="full_name" className="text-foreground font-medium flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-primary" />
            Full Name *
          </Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
            placeholder="Enter your full name"
            className={`bg-secondary/50 border-border text-foreground placeholder-muted-foreground h-12 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 ${errors.full_name ? 'border-destructive' : ''}`}
          />
          {errors.full_name && <p className="text-destructive text-sm mt-1">{errors.full_name}</p>}
        </motion.div>

        <motion.div variants={itemVariants}>
          <Label htmlFor="location" className="text-foreground font-medium flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-primary" />
            Location *
          </Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="City, Country (e.g., Mumbai, India)"
            className={`bg-secondary/50 border-border text-foreground placeholder-muted-foreground h-12 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 ${errors.location ? 'border-destructive' : ''}`}
          />
          {errors.location && <p className="text-destructive text-sm mt-1">{errors.location}</p>}
        </motion.div>

        <motion.div variants={itemVariants}>
          <Label htmlFor="profession" className="text-foreground font-medium flex items-center gap-2 mb-2">
            <Briefcase className="h-4 w-4 text-primary" />
            Profession *
          </Label>
          <Select
            value={formData.profession}
            onValueChange={(value) => setFormData(prev => ({ ...prev, profession: value }))}
          >
            <SelectTrigger className={`bg-secondary/50 border-border text-foreground h-12 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 ${errors.profession ? 'border-destructive' : ''}`}>
              <SelectValue placeholder="Select your profession" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {professions.map((profession) => (
                <SelectItem key={profession} value={profession} className="text-foreground hover:bg-secondary">
                  {profession}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.profession && <p className="text-destructive text-sm mt-1">{errors.profession}</p>}
        </motion.div>
      </motion.div>

      <div className="flex gap-3 pt-4">
        {showPrevious && (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button type="button" variant="outline" onClick={onPrevious} className="border-border hover:bg-secondary rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          </motion.div>
        )}
        <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 glow-primary font-semibold">
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </form>
  );
};
