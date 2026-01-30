import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { OnboardingData } from './OnboardingFlow';
import { ArrowLeft, ArrowRight, Target, Home, GraduationCap, Briefcase, Plane, PiggyBank, TrendingUp, Clock } from 'lucide-react';

interface FinancialGoalsStepProps {
  data: Partial<OnboardingData>;
  onComplete: (data: Partial<OnboardingData>) => void;
  onPrevious: () => void;
  showPrevious: boolean;
}

const goalTypes = [
  { id: 'retirement_planning', label: 'Retirement Planning', icon: PiggyBank },
  { id: 'emergency_fund', label: 'Emergency Fund', icon: Target },
  { id: 'home_purchase', label: 'Home Purchase', icon: Home },
  { id: 'education_fund', label: 'Education Fund', icon: GraduationCap },
  { id: 'wealth_building', label: 'Wealth Building', icon: TrendingUp },
  { id: 'travel_fund', label: 'Travel Fund', icon: Plane },
  { id: 'business_investment', label: 'Business Investment', icon: Briefcase },
  { id: 'other', label: 'Other', icon: Target }
];

const timeframes = [
  '1-2 years',
  '3-5 years',
  '5-10 years',
  '10+ years'
];

export const FinancialGoalsStep: React.FC<FinancialGoalsStepProps> = ({
  data,
  onComplete,
  onPrevious,
  showPrevious
}) => {
  const [formData, setFormData] = useState({
    primary_goal: data.goals?.[0] || '',
    timeframe: '',
    selected_goals: data.goals || [] as string[]
  });

  const handleGoalToggle = (goal: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        selected_goals: [...prev.selected_goals, goal]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        selected_goals: prev.selected_goals.filter(g => g !== goal)
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const allGoals = new Set<string>();
    if (formData.primary_goal) {
      allGoals.add(formData.primary_goal);
    }
    formData.selected_goals.forEach(g => allGoals.add(g));

    onComplete({ goals: Array.from(allGoals) });
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <motion.div className="space-y-5" initial="hidden" animate="visible">
        <motion.div variants={itemVariants}>
          <Label htmlFor="primary_goal" className="text-foreground font-medium flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-primary" />
            Primary Financial Goal
          </Label>
          <Select
            value={formData.primary_goal}
            onValueChange={(value) => setFormData(prev => ({ ...prev, primary_goal: value }))}
          >
            <SelectTrigger className="bg-secondary/50 border-border text-foreground h-12 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20">
              <SelectValue placeholder="Select your primary goal" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {goalTypes.map((goal) => {
                const Icon = goal.icon;
                return (
                  <SelectItem key={goal.id} value={goal.id} className="text-foreground hover:bg-secondary">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      {goal.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Label htmlFor="timeframe" className="text-foreground font-medium flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-primary" />
            Investment Timeframe
          </Label>
          <Select
            value={formData.timeframe}
            onValueChange={(value) => setFormData(prev => ({ ...prev, timeframe: value }))}
          >
            <SelectTrigger className="bg-secondary/50 border-border text-foreground h-12 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {timeframes.map((timeframe) => (
                <SelectItem key={timeframe} value={timeframe} className="text-foreground hover:bg-secondary">
                  {timeframe}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Label className="text-foreground font-medium mb-3 block">Additional Goals (Optional)</Label>
          <Card className="glass border-border/50 p-4 rounded-xl">
            <div className="grid grid-cols-2 gap-3">
              {goalTypes.map((goal) => {
                const Icon = goal.icon;
                const isSelected = formData.selected_goals.includes(goal.id);
                return (
                  <motion.div 
                    key={goal.id} 
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-primary/10 border border-primary/30' 
                        : 'bg-secondary/30 border border-transparent hover:border-border'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleGoalToggle(goal.id, !isSelected)}
                  >
                    <Checkbox
                      id={goal.id}
                      checked={isSelected}
                      onCheckedChange={(checked) => handleGoalToggle(goal.id, checked as boolean)}
                      className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <Icon className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <Label htmlFor={goal.id} className={`text-sm cursor-pointer ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {goal.label}
                      </Label>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
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
