import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Mail, Shield, TrendingUp, AlertCircle, ArrowLeft, Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { OnboardingData } from './OnboardingFlow';

interface EmailIntegrationStepProps {
  data: Partial<OnboardingData>;
  onComplete: (data: Partial<OnboardingData>) => void;
  onPrevious: () => void;
  showPrevious: boolean;
  isLoading: boolean;
}

export const EmailIntegrationStep: React.FC<EmailIntegrationStepProps> = ({
  data,
  onComplete,
  onPrevious,
  showPrevious,
  isLoading
}) => {
  const [enableIntegration, setEnableIntegration] = useState(data.email_integration || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({ email_integration: enableIntegration });
  };

  const handleConnectGmail = async () => {
    console.log('Connecting to Gmail...');
    setEnableIntegration(true);
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <motion.div 
        className="text-center mb-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-4">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Automatic Portfolio Tracking</h3>
        <p className="text-muted-foreground text-sm">
          Connect your email to automatically import your broker transactions and keep your portfolio updated.
        </p>
      </motion.div>

      <motion.div className="space-y-4" initial="hidden" animate="visible">
        <motion.div variants={itemVariants}>
          <Card className="glass border-border/50 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/20 rounded-xl border border-primary/30">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <Label className="font-medium text-foreground">Gmail Integration</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically parse transactions from broker emails
                  </p>
                </div>
              </div>
              <Switch
                checked={enableIntegration}
                onCheckedChange={setEnableIntegration}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </Card>
        </motion.div>

        {enableIntegration && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass border-primary/30 p-4 rounded-xl">
              <h4 className="font-medium mb-3 flex items-center text-foreground">
                <Shield className="h-4 w-4 mr-2 text-success" />
                What we'll do with your email access:
              </h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <TrendingUp className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                  <span>Read emails from verified brokers (Zerodha, Upstox, etc.)</span>
                </li>
                <li className="flex items-start">
                  <TrendingUp className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                  <span>Extract transaction data (buy/sell orders, quantities, prices)</span>
                </li>
                <li className="flex items-start">
                  <Shield className="h-4 w-4 mr-2 mt-0.5 text-success flex-shrink-0" />
                  <span>Your emails are processed securely and never stored</span>
                </li>
              </ul>

              <Card className="bg-primary/10 border-primary/20 p-3 rounded-xl mt-4">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">Privacy First</p>
                    <p className="text-muted-foreground">We only access broker confirmation emails. No personal emails are read or stored.</p>
                  </div>
                </div>
              </Card>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="button"
                  onClick={handleConnectGmail}
                  className="w-full mt-4 bg-secondary hover:bg-secondary/80 text-foreground border border-border rounded-xl"
                  variant="outline"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Connect Gmail Account
                </Button>
              </motion.div>
            </Card>
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <Card className="glass border-border/50 p-4 rounded-xl">
            <h4 className="font-medium mb-3 text-foreground">Supported Brokers</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-primary" />
                Zerodha
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-primary" />
                Upstox
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-primary" />
                Angel One
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-primary" />
                Groww
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-primary" />
                ICICI Direct
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-primary" />
                HDFC Securities
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              More brokers coming soon. You can also manually add transactions anytime.
            </p>
          </Card>
        </motion.div>
      </motion.div>

      <div className="flex gap-3 pt-4">
        {showPrevious && (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button type="button" variant="outline" onClick={onPrevious} disabled={isLoading} className="border-border hover:bg-secondary rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          </motion.div>
        )}
        <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 glow-primary font-semibold" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Setting up your profile...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Complete Setup
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </form>
  );
};
