import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { OnboardingData } from './OnboardingFlow';
import { ArrowLeft, ArrowRight, Shield, TrendingUp, Zap, Flame } from 'lucide-react';

interface RiskAssessmentStepProps {
  data: Partial<OnboardingData>;
  onComplete: (data: Partial<OnboardingData>) => void;
  onPrevious: () => void;
  showPrevious: boolean;
}

const riskQuestions = [
  {
    id: 'market_drop',
    text: 'How would you react to a 20% drop in your portfolio value?',
    options: [
      { text: 'Sell everything immediately to avoid further losses', score: 1 },
      { text: 'Sell some holdings but keep the rest', score: 2 },
      { text: 'Hold all investments and wait for recovery', score: 3 },
      { text: 'Buy more at lower prices', score: 4 }
    ]
  },
  {
    id: 'investment_horizon',
    text: 'What is your typical investment time horizon?',
    options: [
      { text: 'Less than 1 year', score: 1 },
      { text: '1-3 years', score: 2 },
      { text: '3-7 years', score: 3 },
      { text: 'More than 7 years', score: 4 }
    ]
  },
  {
    id: 'income_stability',
    text: 'How stable is your income?',
    options: [
      { text: 'Very unstable, varies significantly', score: 1 },
      { text: 'Somewhat unstable with seasonal variations', score: 2 },
      { text: 'Generally stable with minor fluctuations', score: 3 },
      { text: 'Very stable and predictable', score: 4 }
    ]
  },
  {
    id: 'emergency_fund',
    text: 'Do you have an emergency fund covering 6+ months of expenses?',
    options: [
      { text: 'No emergency fund', score: 1 },
      { text: '1-3 months covered', score: 2 },
      { text: '3-6 months covered', score: 3 },
      { text: '6+ months covered', score: 4 }
    ]
  },
  {
    id: 'investment_knowledge',
    text: 'How would you rate your investment knowledge?',
    options: [
      { text: 'Beginner - I know very little', score: 1 },
      { text: 'Basic - I understand fundamentals', score: 2 },
      { text: 'Intermediate - I actively research investments', score: 3 },
      { text: 'Advanced - I have extensive experience', score: 4 }
    ]
  }
];

export const RiskAssessmentStep: React.FC<RiskAssessmentStepProps> = ({
  data,
  onComplete,
  onPrevious,
  showPrevious
}) => {
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const handleAnswerChange = (questionId: string, score: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: score }));
  };

  const calculateRiskProfile = () => {
    const totalScore = Object.values(answers).reduce((sum, score) => sum + score, 0);
    const maxScore = riskQuestions.length * 4;
    const percentage = (totalScore / maxScore) * 100;

    if (percentage <= 35) return 'conservative';
    if (percentage <= 60) return 'moderate';
    if (percentage <= 85) return 'aggressive';
    return 'very_aggressive';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (Object.keys(answers).length !== riskQuestions.length) {
      return;
    }

    const riskProfile = calculateRiskProfile();
    onComplete({ risk_profile: riskProfile });
  };

  const isComplete = Object.keys(answers).length === riskQuestions.length;

  const getRiskProfileInfo = (profile: string) => {
    switch (profile) {
      case 'conservative':
        return { 
          description: 'You prefer stable investments with lower risk and steady returns.',
          icon: Shield,
          color: 'text-blue-400'
        };
      case 'moderate':
        return { 
          description: 'You seek a balance between growth potential and risk management.',
          icon: TrendingUp,
          color: 'text-primary'
        };
      case 'aggressive':
        return { 
          description: 'You are comfortable with higher risk for potentially greater returns.',
          icon: Zap,
          color: 'text-warning'
        };
      case 'very_aggressive':
        return { 
          description: 'You actively seek maximum returns and are comfortable with high volatility.',
          icon: Flame,
          color: 'text-destructive'
        };
      default:
        return { description: '', icon: Shield, color: 'text-muted-foreground' };
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <motion.div className="space-y-4 max-h-[400px] overflow-y-auto scrollbar-thin pr-2" initial="hidden" animate="visible">
        {riskQuestions.map((question, qIndex) => (
          <motion.div 
            key={question.id}
            variants={itemVariants}
            transition={{ delay: qIndex * 0.1 }}
          >
            <Card className="glass border-border/50 p-4 rounded-xl">
              <h4 className="text-foreground font-medium mb-3 text-sm">{question.text}</h4>
              <RadioGroup
                value={answers[question.id]?.toString() || ''}
                onValueChange={(value) => handleAnswerChange(question.id, parseInt(value))}
                className="space-y-2"
              >
                {question.options.map((option, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                      answers[question.id] === option.score ? 'bg-primary/10 border border-primary/30' : 'hover:bg-secondary/50'
                    }`}
                  >
                    <RadioGroupItem 
                      value={option.score.toString()} 
                      id={`${question.id}-${index}`}
                      className="border-border data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                    />
                    <Label 
                      htmlFor={`${question.id}-${index}`} 
                      className="text-sm cursor-pointer leading-relaxed text-muted-foreground flex-1"
                    >
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </Card>
          </motion.div>
        ))}

        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass border-primary/30 p-4 rounded-xl glow-primary">
              <div className="flex items-center gap-3 mb-2">
                {(() => {
                  const info = getRiskProfileInfo(calculateRiskProfile());
                  const Icon = info.icon;
                  return <Icon className={`h-5 w-5 ${info.color}`} />;
                })()}
                <h4 className="text-foreground font-semibold">Your Risk Profile</h4>
              </div>
              <p className="text-primary font-medium capitalize text-lg mb-1">
                {calculateRiskProfile().replace('_', ' ')}
              </p>
              <p className="text-muted-foreground text-sm">
                {getRiskProfileInfo(calculateRiskProfile()).description}
              </p>
            </Card>
          </motion.div>
        )}
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
          <Button 
            type="submit" 
            disabled={!isComplete}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 glow-primary font-semibold disabled:opacity-50"
          >
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </form>
  );
};
