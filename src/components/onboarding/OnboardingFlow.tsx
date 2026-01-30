import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BasicInfoStep } from './BasicInfoStep';
import { RiskAssessmentStep } from './RiskAssessmentStep';
import { FinancialGoalsStep } from './FinancialGoalsStep';
import { EmailIntegrationStep } from './EmailIntegrationStep';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorToast } from '@/components/ui/error-toast';
import { Typography } from '@/components/ui/design-system';

export interface OnboardingData {
  full_name: string;
  location: string;
  profession: string;
  risk_profile: 'conservative' | 'moderate' | 'aggressive' | 'very_aggressive';
  goals: string[];
  email_integration: boolean;
}

export const OnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ show: boolean; title: string; message: string }>({
    show: false,
    title: '',
    message: ''
  });
  const [onboardingData, setOnboardingData] = useState<Partial<OnboardingData>>({
    goals: [],
    email_integration: false
  });
  
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const steps = [
    { id: 'basic-info', title: 'Basic Information', description: 'Tell us about yourself' },
    { id: 'risk-assessment', title: 'Risk Assessment', description: 'Understand your investment style' },
    { id: 'financial-goals', title: 'Financial Goals', description: 'Set your investment objectives' },
    { id: 'email-integration', title: 'Email Integration', description: 'Connect your broker emails (optional)' }
  ];

  const showError = (title: string, message: string) => {
    setError({ show: true, title, message });
  };

  const hideError = () => {
    setError({ show: false, title: '', message: '' });
  };

  const handleStepComplete = (stepData: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...stepData }));
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleOnboardingComplete();
    }
  };

  const handleOnboardingComplete = async () => {
    if (!user) {
      showError('Authentication Error', 'User not found. Please try signing in again.');
      return;
    }

    setIsLoading(true);
    try {
      // Update the profile with onboarding completion
      // Using 'goals' as string array which matches the database schema
      await updateProfile({
        onboarding_completed: true,
        goals: onboardingData.goals || [],
        full_name: onboardingData.full_name,
        location: onboardingData.location,
      });

      navigate('/home');
    } catch (error) {
      console.error('Onboarding error:', error);
      showError(
        'Onboarding Failed', 
        'There was an error completing your onboarding. Please try again or contact support.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <ErrorToast
        isVisible={error.show}
        onClose={hideError}
        type="error"
        title={error.title}
        message={error.message}
      />
      
      <Card className="w-full max-w-2xl bg-card border border-border">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary font-heading">
            Complete Your Financial Profile
          </CardTitle>
          <Typography.Body className="text-muted-foreground mt-2">
            {steps[currentStep].description}
          </Typography.Body>
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {currentStep === 0 && (
            <BasicInfoStep
              data={onboardingData}
              onComplete={handleStepComplete}
              onPrevious={handlePrevious}
              showPrevious={false}
            />
          )}
          
          {currentStep === 1 && (
            <RiskAssessmentStep
              data={onboardingData}
              onComplete={handleStepComplete}
              onPrevious={handlePrevious}
              showPrevious={true}
            />
          )}
          
          {currentStep === 2 && (
            <FinancialGoalsStep
              data={onboardingData}
              onComplete={handleStepComplete}
              onPrevious={handlePrevious}
              showPrevious={true}
            />
          )}
          
          {currentStep === 3 && (
            <EmailIntegrationStep
              data={onboardingData}
              onComplete={handleStepComplete}
              onPrevious={handlePrevious}
              showPrevious={true}
              isLoading={isLoading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
