import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { OnboardingData } from './OnboardingFlow';

interface FinancialGoalsStepProps {
  data: Partial<OnboardingData>;
  onComplete: (data: Partial<OnboardingData>) => void;
  onPrevious: () => void;
  showPrevious: boolean;
}

const goalTypes = [
  'retirement_planning',
  'emergency_fund',
  'home_purchase',
  'education_fund',
  'wealth_building',
  'travel_fund',
  'business_investment',
  'other'
];

const goalLabels: Record<string, string> = {
  'retirement_planning': 'Retirement Planning',
  'emergency_fund': 'Emergency Fund',
  'home_purchase': 'Home Purchase',
  'education_fund': 'Education Fund',
  'wealth_building': 'Wealth Building',
  'travel_fund': 'Travel Fund',
  'business_investment': 'Business Investment',
  'other': 'Other'
};

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

    // Combine primary goal with selected goals (deduplicated)
    const allGoals = new Set<string>();
    if (formData.primary_goal) {
      allGoals.add(formData.primary_goal);
    }
    formData.selected_goals.forEach(g => allGoals.add(g));

    // Pass goals as a string array which matches the database schema
    onComplete({ goals: Array.from(allGoals) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="primary_goal">Primary Financial Goal</Label>
          <Select
            value={formData.primary_goal}
            onValueChange={(value) => setFormData(prev => ({ ...prev, primary_goal: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your primary goal" />
            </SelectTrigger>
            <SelectContent>
              {goalTypes.map((goal) => (
                <SelectItem key={goal} value={goal}>
                  {goalLabels[goal] || goal}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="timeframe">Investment Timeframe</Label>
          <Select
            value={formData.timeframe}
            onValueChange={(value) => setFormData(prev => ({ ...prev, timeframe: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              {timeframes.map((timeframe) => (
                <SelectItem key={timeframe} value={timeframe}>
                  {timeframe}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-base font-medium">Additional Goals (Optional)</Label>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {goalTypes.map((goal) => (
              <div key={goal} className="flex items-center space-x-2">
                <Checkbox
                  id={goal}
                  checked={formData.selected_goals.includes(goal)}
                  onCheckedChange={(checked) => handleGoalToggle(goal, checked as boolean)}
                />
                <Label htmlFor={goal} className="text-sm cursor-pointer">
                  {goalLabels[goal] || goal}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {showPrevious && (
          <Button type="button" variant="outline" onClick={onPrevious}>
            Previous
          </Button>
        )}
        <Button type="submit" className="btn-premium flex-1">
          Continue
        </Button>
      </div>
    </form>
  );
};
