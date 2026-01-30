import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, TrendingUp, DollarSign, MessageSquare, 
  ArrowRight, CheckCircle, Zap, Target, BarChart3,
  Shield, Sparkles, ChevronRight
} from 'lucide-react';

const Landing: React.FC = () => {
  const features = [
    {
      icon: Users,
      title: 'Financial Community',
      description: 'Connect with investors, traders, financial advisors, and finance enthusiasts from across India.',
    },
    {
      icon: BarChart3,
      title: 'Investment Insights',
      description: 'Share investment strategies, market analysis, and get advice from experienced investors.',
    },
    {
      icon: TrendingUp,
      title: 'Market Discussions',
      description: 'Stay updated with stock market trends, crypto insights, and financial news discussions.',
    },
    {
      icon: MessageSquare,
      title: 'Financial Mentorship',
      description: 'Connect with financial mentors, share experiences, and learn from successful investors.',
    }
  ];

  const stats = [
    { number: '50K+', label: 'Financial Enthusiasts' },
    { number: '1000+', label: 'Investment Advisors' },
    { number: '25K+', label: 'Market Discussions' },
    { number: '500+', label: 'Finance Experts' }
  ];

  const testimonials = [
    {
      name: 'Priya S.',
      role: 'Equity Research Analyst',
      company: 'Securities Firm',
      content: 'InvestorPaisa helped me connect with seasoned investors and learn practical investment strategies. The community discussions are incredibly valuable.',
      initials: 'PS',
      verified: true
    },
    {
      name: 'Rahul V.',
      role: 'Mutual Fund Distributor',
      company: 'Investment Platform',
      content: 'The quality of financial discussions and market insights shared here is exceptional. It\'s become my daily source for investment ideas.',
      initials: 'RV',
      verified: true
    },
    {
      name: 'Ananya P.',
      role: 'Finance Blogger',
      company: 'Personal Finance Pro',
      content: 'From learning about SIPs to understanding market cycles, InvestorPaisa has been instrumental in my financial education journey.',
      initials: 'AP',
      verified: false
    }
  ];

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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center glow-primary">
                <TrendingUp className="text-primary-foreground h-5 w-5" />
              </div>
              <span className="font-bold text-xl font-heading">
                Investor<span className="text-primary">Paisa</span>
              </span>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">Live</Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/auth/login">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground font-medium">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth/register">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl glow-primary">
                  Join Community
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <motion.section 
        className="pt-20 pb-32 px-4 relative overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div className="max-w-4xl mx-auto" variants={itemVariants}>
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/30 mb-8"
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">India's Premier Financial Community</span>
            </motion.div>

            <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-tight font-heading">
              Your Financial
              <span className="gradient-text"> Community</span>
              <br />Awaits You
            </h1>
            
            <p className="text-xl lg:text-2xl text-muted-foreground mb-12 leading-relaxed max-w-3xl mx-auto">
              Connect with investors, share market insights, and grow your wealth together 
              on India's premier financial social platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link to="/auth/register">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 h-auto rounded-2xl glow-primary font-semibold">
                    Start Investing Together
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
              <Link to="/discover">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto border-2 border-border hover:bg-secondary rounded-2xl">
                    Explore Markets
                  </Button>
                </motion.div>
              </Link>
            </div>

            {/* Stats */}
            <motion.div 
              className="grid grid-cols-2 lg:grid-cols-4 gap-6 glass rounded-3xl p-8 border border-border/50"
              variants={itemVariants}
            >
              {stats.map((stat, index) => (
                <motion.div 
                  key={index} 
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="text-3xl lg:text-4xl font-bold gradient-text mb-2 font-heading">
                    {stat.number}
                  </div>
                  <div className="text-muted-foreground font-medium text-sm">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-card/50">
        <motion.div 
          className="max-w-7xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div className="text-center mb-16" variants={itemVariants}>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 font-heading">
              Everything You Need for
              <span className="gradient-text"> Financial Success</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our comprehensive platform provides all the tools you need to build your investment knowledge,
              connect with the right people, and grow your wealth systematically.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <Card className="glass hover:border-primary/30 transition-all duration-300 rounded-2xl h-full">
                  <CardContent className="p-8">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
                        <feature.icon className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-3 font-heading">
                          {feature.title}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4">
        <motion.div 
          className="max-w-7xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div className="text-center mb-16" variants={itemVariants}>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 font-heading">
              Trusted by
              <span className="gradient-text"> Smart Investors</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Join thousands of investors who have enhanced their financial journey with InvestorPaisa.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={index}
                variants={itemVariants}
                whileHover={{ y: -5 }}
              >
                <Card className="glass hover:border-primary/30 transition-all duration-300 rounded-2xl h-full">
                  <CardContent className="p-8">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 rounded-full mr-4 bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold">
                        {testimonial.initials}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold">{testimonial.name}</h4>
                          {testimonial.verified && (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        <p className="text-sm text-muted-foreground/70">{testimonial.company}</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground leading-relaxed italic">
                      "{testimonial.content}"
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <motion.div 
          className="max-w-4xl mx-auto text-center glass rounded-3xl p-12 border border-primary/30 glow-primary-lg relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            <Sparkles className="h-12 w-12 text-primary mx-auto mb-6" />
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 font-heading">
              Ready to Accelerate Your Wealth?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join InvestorPaisa today and connect with investment opportunities that matter.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/register">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 h-auto font-semibold rounded-2xl">
                    Start Your Journey
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
              <Link to="/discover">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto rounded-2xl border-2 border-border hover:bg-secondary">
                    Explore Markets
                  </Button>
                </motion.div>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center">
                  <TrendingUp className="text-primary-foreground h-4 w-4" />
                </div>
                <span className="font-bold text-xl font-heading">
                  Investor<span className="text-primary">Paisa</span>
                </span>
              </div>
              <p className="text-muted-foreground max-w-md">
                Building the future of financial community in India. Invest, learn, and grow together with us.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/feed" className="hover:text-primary transition-colors">Investment Feed</Link></li>
                <li><Link to="/circles" className="hover:text-primary transition-colors">Circles</Link></li>
                <li><Link to="/discover" className="hover:text-primary transition-colors">Discover</Link></li>
                <li><Link to="/messages" className="hover:text-primary transition-colors">Messages</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 InvestorPaisa. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
