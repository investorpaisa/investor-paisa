
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, TrendingUp, DollarSign, MessageSquare, 
  Star, Shield, Award, Globe, ArrowRight,
  CheckCircle, Zap, Target, BarChart3
} from 'lucide-react';

const Landing: React.FC = () => {
  const features = [
    {
      icon: Users,
      title: 'Financial Community',
      description: 'Connect with investors, traders, financial advisors, and finance enthusiasts from across India.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      icon: DollarSign,
      title: 'Investment Insights',
      description: 'Share investment strategies, market analysis, and get advice from experienced investors.',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      icon: TrendingUp,
      title: 'Market Discussions',
      description: 'Stay updated with stock market trends, crypto insights, and financial news discussions.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      icon: MessageSquare,
      title: 'Financial Mentorship',
      description: 'Connect with financial mentors, share experiences, and learn from successful investors.',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl flex items-center justify-center">
                <DollarSign className="text-white h-6 w-6" />
              </div>
              <span className="font-bold text-2xl text-gray-900">InvestorPaisa</span>
              <Badge className="bg-green-100 text-green-800 text-xs rounded-full">Live</Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/auth/login">
                <Button variant="ghost" className="font-medium rounded-2xl">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth/register">
                <Button className="bg-blue-600 hover:bg-blue-700 font-medium rounded-2xl">
                  Join Community
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              Your Financial
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent"> Community</span>
              <br />Awaits You
            </h1>
            
            <p className="text-xl lg:text-2xl text-gray-600 mb-12 leading-relaxed">
              Connect with investors, share market insights, and grow your wealth together 
              on India's premier financial social platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link to="/auth/register">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4 h-auto rounded-2xl">
                  Start Investing Together
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/market">
                <Button variant="outline" size="lg" className="text-lg px-8 py-4 h-auto border-2 rounded-2xl">
                  Explore Markets
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 bg-white/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-200">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need for
              <span className="text-green-600"> Financial Success</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive platform provides all the tools you need to build your investment knowledge,
              connect with the right people, and grow your wealth systematically.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-green-200 rounded-3xl">
                <CardContent className="p-8">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-2xl ${feature.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className={`h-8 w-8 ${feature.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Trusted by
              <span className="text-green-600"> Smart Investors</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of investors who have enhanced their financial journey with InvestorPaisa.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300 rounded-3xl">
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 rounded-full mr-4 bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center text-white font-semibold">
                      {testimonial.initials}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                        {testimonial.verified && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                      <p className="text-sm text-gray-500">{testimonial.company}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed italic">
                    "{testimonial.content}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Accelerate Your Wealth?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join InvestorPaisa today and connect with investment opportunities that matter.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4 h-auto font-semibold rounded-2xl">
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/market">
              <Button variant="outline" size="lg" className="text-white border-white hover:bg-white hover:text-blue-600 text-lg px-8 py-4 h-auto rounded-2xl">
                Explore Markets
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl flex items-center justify-center">
                  <DollarSign className="text-white h-5 w-5" />
                </div>
                <span className="font-bold text-xl">InvestorPaisa</span>
              </div>
              <p className="text-gray-400 max-w-md">
                Building the future of financial community in India. Invest, learn, and grow together with us.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/professional" className="hover:text-white">Investment Feed</Link></li>
                <li><Link to="/network" className="hover:text-white">My Network</Link></li>
                <li><Link to="/market" className="hover:text-white">Markets</Link></li>
                <li><Link to="/messages" className="hover:text-white">Messages</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 InvestorPaisa. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
