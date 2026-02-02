import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { TrendingUp, Users, MessageSquare, Shield } from 'lucide-react';

interface FeatureCard {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const features: FeatureCard[] = [
  {
    icon: <MessageSquare className="h-6 w-6 text-primary" />,
    title: "Ask Anything",
    description: "Get answers to your investment questions from AI and community experts",
  },
  {
    icon: <TrendingUp className="h-6 w-6 text-primary" />,
    title: "Market Insights",
    description: "Real-time market data and AI-powered analysis at your fingertips",
  },
  {
    icon: <Users className="h-6 w-6 text-primary" />,
    title: "Expert Network",
    description: "Connect with verified financial experts and learn from the best",
  },
  {
    icon: <Shield className="h-6 w-6 text-primary" />,
    title: "Verified Content",
    description: "Community-vetted answers you can trust for your financial decisions",
  },
];

export const AutoScrollCards: React.FC = () => {
  // Duplicate cards for infinite scroll effect
  const duplicatedFeatures = [...features, ...features];

  return (
    <div className="w-full overflow-hidden py-6">
      <motion.div
        className="flex gap-4"
        animate={{
          x: [0, -50 * features.length * 4], // Scroll through duplicated cards
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 30,
            ease: "linear",
          },
        }}
      >
        {duplicatedFeatures.map((feature, index) => (
          <Card
            key={index}
            className="flex-shrink-0 w-64 p-4 bg-card/50 border-border/50 hover:border-primary/30 transition-all hover:-translate-y-1"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                {feature.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {feature.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </motion.div>
    </div>
  );
};

export const CommunityProof: React.FC = () => {
  const stats = [
    { value: '10K+', label: 'Investors' },
    { value: '50K+', label: 'Questions Answered' },
    { value: '500+', label: 'Verified Experts' },
    { value: '4.8', label: 'App Rating' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-8">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * index, duration: 0.5 }}
          className="text-center"
        >
          <div className="text-2xl sm:text-3xl font-bold gradient-text mb-1">
            {stat.value}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">
            {stat.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
};