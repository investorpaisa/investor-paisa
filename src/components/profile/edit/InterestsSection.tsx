import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Heart, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';

interface InterestsSectionProps {
  interests: string[];
  onUpdate: (interests: string[]) => void;
}

// Financial interests organized by awareness/experience level
const INTEREST_CATEGORIES = {
  'Beginner': [
    'Savings Accounts',
    'Fixed Deposits',
    'Insurance Basics',
    'Budgeting',
    'Emergency Fund',
    'Credit Score',
    'Banking',
    'Personal Finance 101',
  ],
  'Intermediate': [
    'Mutual Funds',
    'SIPs',
    'Tax Planning',
    'Gold Investing',
    'PPF & EPF',
    'NPS',
    'Index Funds',
    'Bonds',
    'Health Insurance',
    'Term Insurance',
    'Real Estate',
  ],
  'Advanced': [
    'Direct Stocks',
    'Options Trading',
    'Portfolio Management',
    'Technical Analysis',
    'Fundamental Analysis',
    'IPOs',
    'ETFs',
    'Sectoral Funds',
    'Small Cap Investing',
    'Dividend Investing',
    'Value Investing',
  ],
  'Expert': [
    'Derivatives',
    'Forex Trading',
    'Algorithmic Trading',
    'Alternative Investments',
    'Venture Capital',
    'Private Equity',
    'Hedge Funds',
    'Commodities Trading',
    'Crypto Assets',
    'REIT Investing',
    'Tax Harvesting',
    'Estate Planning',
  ],
};

const MAX_INTERESTS = 10;

export const InterestsSection: React.FC<InterestsSectionProps> = ({
  interests,
  onUpdate,
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [customInterest, setCustomInterest] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      onUpdate(interests.filter(i => i !== interest));
    } else {
      if (interests.length >= MAX_INTERESTS) {
        toast.error(`You can select a maximum of ${MAX_INTERESTS} interests`);
        return;
      }
      onUpdate([...interests, interest]);
    }
  };

  const addCustomInterest = () => {
    const trimmed = customInterest.trim();
    if (!trimmed) return;
    
    if (interests.includes(trimmed)) {
      toast.error('This interest is already added');
      return;
    }
    
    if (interests.length >= MAX_INTERESTS) {
      toast.error(`You can select a maximum of ${MAX_INTERESTS} interests`);
      return;
    }
    
    onUpdate([...interests, trimmed]);
    setCustomInterest('');
    setShowCustomInput(false);
  };

  const removeInterest = (interest: string) => {
    onUpdate(interests.filter(i => i !== interest));
  };

  return (
    <Card className="glass border-border/50 rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-base sm:text-lg font-semibold">
            <Heart className="h-5 w-5 mr-2 text-primary" />
            Interests
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCustomInput(!showCustomInput)}
            className="h-8 px-3 border-primary/50 text-primary hover:bg-primary/10"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Interests */}
        {interests.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Selected: {interests.length}/{MAX_INTERESTS}
            </p>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <Badge
                  key={interest}
                  variant="default"
                  className="bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 cursor-pointer pr-1"
                >
                  {interest}
                  <button
                    type="button"
                    onClick={() => removeInterest(interest)}
                    className="ml-1 p-0.5 rounded-full hover:bg-primary/30"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Custom Interest Input */}
        {showCustomInput && (
          <div className="flex gap-2">
            <Input
              value={customInterest}
              onChange={(e) => setCustomInterest(e.target.value)}
              placeholder="Enter custom interest..."
              className="h-9 text-sm bg-secondary/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomInterest();
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              onClick={addCustomInterest}
              disabled={!customInterest.trim()}
              className="h-9"
            >
              Add
            </Button>
          </div>
        )}

        {/* Interest Categories */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground mb-3">
            Select from predefined interests by experience level:
          </p>
          
          {Object.entries(INTEREST_CATEGORIES).map(([category, categoryInterests]) => (
            <Collapsible
              key={category}
              open={expandedCategory === category}
              onOpenChange={(open) => setExpandedCategory(open ? category : null)}
            >
              <div className="border border-border/50 rounded-xl overflow-hidden bg-secondary/30">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{category}</span>
                      <Badge variant="outline" className="text-[10px] h-5">
                        {categoryInterests.length} options
                      </Badge>
                    </div>
                    {expandedCategory === category ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="p-3 pt-0 border-t border-border/50">
                    <div className="flex flex-wrap gap-2">
                      {categoryInterests.map((interest) => {
                        const isSelected = interests.includes(interest);
                        return (
                          <Badge
                            key={interest}
                            variant={isSelected ? "default" : "outline"}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-secondary/50"
                            }`}
                            onClick={() => toggleInterest(interest)}
                          >
                            {interest}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>

        {interests.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Select your financial interests to personalize your experience
          </p>
        )}
      </CardContent>
    </Card>
  );
};
