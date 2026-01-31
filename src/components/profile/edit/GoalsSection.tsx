import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Target, X, Plus, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

// Top 256 financial goals
const FINANCIAL_GOALS = [
  // Wealth Building & Investments
  "Build emergency fund", "Achieve financial independence", "Retire early (FIRE)", "Create passive income streams",
  "Invest in index funds", "Build stock portfolio", "Invest in mutual funds", "Start SIP investments",
  "Invest in real estate", "Build rental property portfolio", "Invest in REITs", "Start angel investing",
  "Build dividend portfolio", "Invest in bonds", "Create balanced portfolio", "Maximize compound interest",
  "Build ₹1 Crore corpus", "Build ₹5 Crore corpus", "Build ₹10 Crore corpus", "Achieve millionaire status",
  
  // Retirement Planning
  "Plan for retirement", "Maximize EPF contributions", "Invest in NPS", "Build pension fund",
  "Calculate retirement corpus", "Plan early retirement", "Create retirement income", "Secure spouse's retirement",
  "Plan phased retirement", "Set retirement age goal", "Build retirement real estate", "Create healthcare fund for retirement",
  
  // Tax Planning & Savings
  "Optimize tax savings", "Use 80C deductions fully", "Invest in ELSS funds", "Plan capital gains tax",
  "Use HRA benefits", "Claim home loan benefits", "Plan inheritance tax", "Use NPS tax benefits",
  "Structure salary for tax efficiency", "Plan for long-term capital gains", "Use 80D health insurance deductions", "Charitable donations (80G)",
  
  // Insurance & Protection
  "Get term life insurance", "Buy health insurance", "Get critical illness cover", "Plan for disability insurance",
  "Buy family floater policy", "Get personal accident cover", "Plan insurance for parents", "Review insurance coverage annually",
  
  // Debt Management
  "Become debt-free", "Pay off home loan early", "Clear credit card debt", "Pay off personal loans",
  "Consolidate debts", "Improve credit score", "Avoid new debt", "Create debt repayment plan",
  "Refinance existing loans", "Negotiate lower interest rates", "Pay off education loans", "Clear vehicle loans",
  
  // Real Estate Goals
  "Buy first home", "Buy dream home", "Buy investment property", "Build house from scratch",
  "Renovate home", "Buy vacation home", "Invest in commercial property", "Build real estate portfolio",
  "Buy plot of land", "Invest in farmland", "Buy property abroad", "Downsize home in retirement",
  
  // Children & Education
  "Save for child's education", "Create education fund", "Plan for IIT/IIM fees", "Save for abroad education",
  "Fund children's wedding", "Create child's investment account", "Plan for multiple children's education", "Build corpus for school fees",
  "Save for professional courses", "Fund children's startup", "Create inheritance for children", "Plan for grandchildren's education",
  
  // Lifestyle Goals
  "Buy dream car", "Plan international travel", "Fund hobby expenses", "Create lifestyle fund",
  "Plan sabbatical year", "Build vacation fund", "Upgrade lifestyle sustainably", "Fund fitness goals",
  "Create entertainment budget", "Plan bucket list experiences", "Fund home theater", "Build wine/art collection",
  
  // Business & Career
  "Start own business", "Fund startup idea", "Build business reserves", "Create business emergency fund",
  "Plan business expansion", "Build working capital", "Fund franchise purchase", "Create business exit strategy",
  "Build professional network fund", "Fund career transition", "Save for MBA/higher education", "Build consulting practice",
  
  // Emergency & Security
  "Build 6-month emergency fund", "Build 12-month emergency fund", "Create job loss fund", "Build medical emergency fund",
  "Create family security fund", "Plan for economic downturns", "Build inflation hedge", "Create currency diversification",
  
  // Giving & Legacy
  "Create charitable giving plan", "Start family foundation", "Plan legacy giving", "Fund educational scholarships",
  "Support causes you care about", "Create donor-advised fund", "Plan estate distribution", "Build generational wealth",
  
  // Alternative Investments
  "Invest in gold", "Build gold reserves", "Invest in cryptocurrency", "Explore NFT investments",
  "Invest in startups", "Join angel investor network", "Invest in commodities", "Explore P2P lending",
  "Invest in art", "Build collectibles portfolio", "Invest in wine", "Explore venture capital",
  
  // Financial Knowledge
  "Learn stock analysis", "Master technical analysis", "Understand derivatives", "Learn forex trading",
  "Study value investing", "Learn options trading", "Understand crypto markets", "Master portfolio management",
  "Learn tax laws", "Study financial planning", "Get CFP certification", "Understand behavioral finance",
  
  // Family Financial Goals
  "Combine finances with spouse", "Plan for aging parents", "Create family budget", "Teach kids about money",
  "Plan multi-generational wealth", "Create family trust", "Plan for dependent siblings", "Build family emergency fund",
  
  // Short-term Savings
  "Save for vacation", "Save for wedding", "Build gadget fund", "Save for home renovation",
  "Build gift fund", "Save for major purchase", "Create annual bonus strategy", "Build festival expense fund",
  
  // Income Growth
  "Increase salary 20%", "Build multiple income streams", "Create royalty income", "Build online business income",
  "Generate rental income", "Create consulting income", "Build freelance income", "Generate interest income",
  "Create YouTube/content income", "Build course/teaching income", "Generate affiliate income", "Build app/software income",
  
  // Financial Organization
  "Track all expenses", "Create monthly budget", "Automate investments", "Review finances quarterly",
  "Organize financial documents", "Create financial calendar", "Set up auto-payments", "Consolidate accounts",
  "Use budgeting apps", "Track net worth monthly", "Create financial dashboard", "Simplify finances",
  
  // Specific Amount Goals
  "Save ₹10,000/month", "Save ₹25,000/month", "Save ₹50,000/month", "Save ₹1 Lakh/month",
  "Invest 30% of income", "Invest 40% of income", "Invest 50% of income", "Live on 50% of income",
  
  // Age-based Goals
  "Build wealth before 30", "Achieve FI by 40", "Retire by 45", "Become crorepati by 35",
  "Own home by 30", "Clear all debts by 35", "Build ₹1Cr by 40", "Complete financial planning by 25",
  
  // Risk Management
  "Diversify investments", "Rebalance portfolio annually", "Reduce portfolio risk", "Create hedging strategy",
  "Plan for inflation", "Protect against market crashes", "Build defensive portfolio", "Create risk assessment plan",
  
  // Unique Goals
  "Fund world tour", "Buy farmhouse", "Start NGO", "Fund research project",
  "Create scholarship fund", "Buy yacht/boat", "Fund sports career", "Build art collection",
  "Fund music/creative career", "Buy sports franchise stake", "Fund documentary project", "Create memorial fund"
];

interface GoalsSectionProps {
  goals: string[];
  onUpdate: (goals: string[]) => void;
}

export const GoalsSection: React.FC<GoalsSectionProps> = ({ goals, onUpdate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [customGoal, setCustomGoal] = useState('');

  const filteredGoals = FINANCIAL_GOALS.filter(goal => 
    goal.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !goals.includes(goal)
  ).slice(0, 10);

  const addGoal = (goal: string) => {
    if (!goals.includes(goal) && goals.length < 10) {
      onUpdate([...goals, goal]);
    }
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const removeGoal = (goal: string) => {
    onUpdate(goals.filter(g => g !== goal));
  };

  const addCustomGoal = () => {
    if (customGoal.trim() && !goals.includes(customGoal.trim()) && goals.length < 10) {
      onUpdate([...goals, customGoal.trim()]);
      setCustomGoal('');
    }
  };

  return (
    <Card className="glass border-border/50 rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-base sm:text-lg font-semibold">
          <Target className="h-5 w-5 mr-2 text-primary" />
          Financial Goals
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Select up to 10 financial goals (15 points toward profile completion)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Goals */}
        {goals.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {goals.map((goal, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="px-3 py-1.5 text-xs flex items-center gap-1.5 bg-primary/10 text-primary border-primary/30"
              >
                {goal}
                <button 
                  onClick={() => removeGoal(goal)}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Search/Add Goal */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search financial goals..."
              className="pl-10 bg-secondary/50 border-border/50"
              disabled={goals.length >= 10}
            />
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && searchQuery && filteredGoals.length > 0 && (
            <Card className="absolute z-50 w-full mt-1 border border-border/50 bg-background shadow-lg">
              <ScrollArea className="max-h-64">
                <div className="p-1">
                  {filteredGoals.map((goal, index) => (
                    <button
                      key={index}
                      onClick={() => addGoal(goal)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-secondary/50 rounded-md transition-colors"
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          )}
        </div>

        {/* Custom Goal Input */}
        <div className="flex gap-2">
          <Input
            value={customGoal}
            onChange={(e) => setCustomGoal(e.target.value)}
            placeholder="Add custom goal..."
            className="bg-secondary/50 border-border/50 flex-1"
            disabled={goals.length >= 10}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomGoal();
              }
            }}
          />
          <Button 
            variant="outline" 
            size="icon"
            onClick={addCustomGoal}
            disabled={!customGoal.trim() || goals.length >= 10}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {goals.length >= 10 && (
          <p className="text-xs text-muted-foreground">Maximum 10 goals reached</p>
        )}

        {/* Popular Goals Quick Select */}
        {goals.length < 10 && !searchQuery && (
          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-2">Popular goals:</p>
            <div className="flex flex-wrap gap-1.5">
              {FINANCIAL_GOALS.slice(0, 8).filter(g => !goals.includes(g)).slice(0, 5).map((goal, index) => (
                <Badge 
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors text-xs"
                  onClick={() => addGoal(goal)}
                >
                  <Plus className="h-2.5 w-2.5 mr-1" />
                  {goal}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
