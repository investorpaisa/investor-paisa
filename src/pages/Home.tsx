import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  Users,
  BookOpen,
  Bell,
  ArrowRight,
  Crown,
  Target,
  PieChart,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Typography, SystemCard, SystemButton } from '@/components/ui/design-system';

export default function Home() {
  const { profile, isLoading } = useAuth();
  const navigate = useNavigate();

  // Only redirect to onboarding if profile exists but onboarding is not completed
  useEffect(() => {
    if (!isLoading && profile) {
      if (profile.onboarding_completed === false) {
        console.log('Redirecting to onboarding - onboarding_completed:', profile.onboarding_completed);
        navigate('/onboarding');
      }
    }
  }, [profile, isLoading, navigate]);

  // Show loading while we're checking the profile
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <Typography.Body>Loading...</Typography.Body>
        </motion.div>
      </div>
    );
  }

  // Don't render anything if we're about to redirect to onboarding
  if (profile && profile.onboarding_completed === false) {
    return null;
  }

  const getTrustLevelColor = (level: string | null | undefined) => {
    switch (level) {
      case 'expert':
      case 'legend':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'trusted':
        return 'bg-secondary/20 text-secondary-foreground border-secondary/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const quickActions = [
    {
      title: 'Join Circles',
      description: 'Connect with like-minded investors',
      icon: Users,
      href: '/circles',
      gradient: 'from-primary/20 to-primary/10'
    },
    {
      title: 'Explore Feed',
      description: 'Latest posts and insights',
      icon: TrendingUp,
      href: '/feed',
      gradient: 'from-secondary/20 to-secondary/10'
    },
    {
      title: 'Discover',
      description: 'Find topics and experts',
      icon: BookOpen,
      href: '/discover',
      gradient: 'from-accent/20 to-accent/10'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Welcome Header */}
        <motion.div variants={itemVariants}>
          <SystemCard variant="glass" className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                  >
                    <Sparkles className="h-8 w-8 text-primary" />
                  </motion.div>
                  <Typography.H2>
                    Welcome back, {profile?.full_name || profile?.username || 'Investor'}!
                  </Typography.H2>
                  <Badge className={getTrustLevelColor(profile?.trust_level)}>
                    {profile?.trust_level?.charAt(0).toUpperCase()}{profile?.trust_level?.slice(1) || 'Member'}
                  </Badge>
                  {profile?.is_expert && (
                    <Crown className="h-5 w-5 text-primary" />
                  )}
                </div>
                <Typography.Body className="text-lg text-muted-foreground">
                  Ready to grow your wealth? Let's explore today's opportunities.
                </Typography.Body>
              </div>
              <div className="text-center md:text-right">
                <Typography.Small className="text-muted-foreground">Trust Score</Typography.Small>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                >
                  <Typography.H2 className="text-primary">
                    {profile?.trust_score || 0}/100
                  </Typography.H2>
                </motion.div>
              </div>
            </div>
          </SystemCard>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="cursor-pointer"
                onClick={() => navigate(action.href)}
              >
                <SystemCard variant="default" className="hover:border-primary/30 transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center`}>
                      <Icon className="h-6 w-6 text-foreground" />
                    </div>
                    <div className="flex-1">
                      <Typography.H3 className="text-lg mb-1">{action.title}</Typography.H3>
                      <Typography.Small className="text-muted-foreground">{action.description}</Typography.Small>
                    </div>
                    <ArrowRight className="h-5 w-5 text-primary" />
                  </div>
                </SystemCard>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="feed" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-muted/50 border border-border">
              <TabsTrigger value="feed" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Feed</TabsTrigger>
              <TabsTrigger value="portfolio" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Portfolio</TabsTrigger>
              <TabsTrigger value="goals" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Goals</TabsTrigger>
              <TabsTrigger value="alerts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Alerts</TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="space-y-4">
              <SystemCard>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span>Latest from Your Network</span>
                  </CardTitle>
                  <CardDescription>
                    Recent posts from circles and people you follow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Users className="h-16 w-16 mx-auto mb-4 text-primary/50" />
                    </motion.div>
                    <Typography.Body className="mb-4">No recent activity in your network.</Typography.Body>
                    <SystemButton onClick={() => navigate('/feed')}>
                      Explore Feed
                    </SystemButton>
                  </div>
                </CardContent>
              </SystemCard>
            </TabsContent>

            <TabsContent value="portfolio" className="space-y-4">
              <SystemCard>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    <span>Portfolio Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <PieChart className="h-16 w-16 mx-auto mb-4 text-primary/50" />
                    <Typography.Body className="mb-4 text-muted-foreground">
                      Portfolio value: ₹{profile?.portfolio_value?.toLocaleString() || '0'}
                    </Typography.Body>
                    <SystemButton>Track Portfolio</SystemButton>
                  </div>
                </CardContent>
              </SystemCard>
            </TabsContent>

            <TabsContent value="goals" className="space-y-4">
              <SystemCard>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-primary" />
                    <span>Financial Goals</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile?.goals && profile.goals.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.goals.map((goal, index) => (
                          <Badge key={index} variant="secondary">
                            {goal.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Target className="h-12 w-12 mx-auto mb-4 text-primary/50" />
                        <Typography.Body className="text-muted-foreground mb-4">No goals set yet</Typography.Body>
                        <SystemButton onClick={() => navigate('/edit-profile')}>Set Goals</SystemButton>
                      </div>
                    )}
                  </div>
                </CardContent>
              </SystemCard>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              <SystemCard>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5 text-primary" />
                    <span>Market Alerts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Bell className="h-16 w-16 mx-auto mb-4 text-primary/50" />
                    <Typography.Body className="mb-4 text-muted-foreground">No active alerts.</Typography.Body>
                    <SystemButton>Set Up Alerts</SystemButton>
                  </div>
                </CardContent>
              </SystemCard>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </div>
  );
}
