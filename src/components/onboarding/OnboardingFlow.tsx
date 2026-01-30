import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BasicInfoStep } from './BasicInfoStep';
import { RiskAssessmentStep } from './RiskAssessmentStep';
import { FinancialGoalsStep } from './FinancialGoalsStep';
import { EmailIntegrationStep } from './EmailIntegrationStep';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorToast } from '@/components/ui/error-toast';
import { TrendingUp, Sparkles } from 'lucide-react';

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.6, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <ErrorToast
        isVisible={error.show}
        onClose={hideError}
        type="error"
        title={error.title}
        message={error.message}
      />
      
      <motion.div
        className="w-full max-w-2xl relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo Header */}
        <motion.div className="text-center mb-8" variants={itemVariants}>
          <motion.div 
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-4 glow-primary"
            whileHover={{ rotate: 5, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <TrendingUp className="w-8 h-8 text-primary-foreground" />
          </motion.div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass rounded-3xl border border-border/50 overflow-hidden">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-2xl font-bold text-primary font-heading">
                  Complete Your Financial Profile
                </CardTitle>
              </div>
              <p className="text-muted-foreground">
                {steps[currentStep].description}
              </p>
              
              {/* Progress Section */}
              <div className="mt-6">
                <Progress value={progress} className="h-2 bg-secondary" />
                <div className="flex justify-between mt-3 text-sm text-muted-foreground">
                  <span>Step {currentStep + 1} of {steps.length}</span>
                  <span className="text-primary font-medium">{Math.round(progress)}% Complete</span>
                </div>
              </div>

              {/* Step Indicators */}
              <div className="flex justify-center gap-2 mt-4">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      index <= currentStep 
                        ? 'bg-primary glow-primary' 
                        : 'bg-muted'
                    }`}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: index === currentStep ? 1.2 : 1 }}
                  />
                ))}
              </div>
            </CardHeader>
            
            <CardContent className="p-6 pt-0">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
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
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};
