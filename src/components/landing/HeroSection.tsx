
import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Users, TrendingUp } from 'lucide-react';
import { PremiumButton } from '../ui/premium/button';

const HeroSection = () => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Adding a staggered animation effect to title
    const titleElement = titleRef.current;
    const imageContainer = imageContainerRef.current;
    
    if (titleElement) {
      setTimeout(() => {
        titleElement.classList.add('animate-reveal');
        titleElement.classList.remove('opacity-0');
      }, 300);
    }
    
    if (imageContainer) {
      setTimeout(() => {
        imageContainer.classList.add('animate-float');
        imageContainer.classList.remove('opacity-0', 'translate-y-8');
      }, 600);
    }
  }, []);
  
  return (
    <section className="py-10 px-6 bg-white border border-black/5 rounded-lg mb-6 overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-10 w-20 h-20 rounded-full bg-gold/10 blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-gold/5 blur-xl"></div>
        <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent top-10"></div>
        <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-gold/10 to-transparent bottom-10"></div>
      </div>
      
      <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
        <div className="flex-1 text-center md:text-left">
          <h1 
            ref={titleRef}
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight opacity-0 transition-opacity duration-1000"
          >
            <span className="bg-clip-text text-transparent bg-gradient-gold">Where Finance Meets</span>{' '}
            <br className="hidden md:block" />
            <span className="relative">
              Community
              <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-gold to-transparent"></span>
            </span>
          </h1>
          
          <p className="text-sm md:text-base text-black/60 mb-6 max-w-md">
            Get reliable financial insights, connect with experts, and join a thriving community of financial enthusiasts.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <PremiumButton asChild size="lg" animation="glow">
              <Link to="/auth/register">
                Join Now
                <ArrowRight className="ml-1 h-5 w-5" />
              </Link>
            </PremiumButton>
            <PremiumButton asChild variant="outline" size="lg">
              <Link to="/auth/login">
                Sign In
              </Link>
            </PremiumButton>
          </div>
          
          <div className="mt-10 grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center md:items-start p-2">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-gold" />
                <span className="text-sm font-medium">Market Data</span>
              </div>
              <p className="text-xs text-black/60 hidden md:block">Real-time insights</p>
            </div>
            <div className="flex flex-col items-center md:items-start p-2">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-gold" />
                <span className="text-sm font-medium">Expert Community</span>
              </div>
              <p className="text-xs text-black/60 hidden md:block">Connect with pros</p>
            </div>
            <div className="flex flex-col items-center md:items-start p-2">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-gold" />
                <span className="text-sm font-medium">Trusted Advice</span>
              </div>
              <p className="text-xs text-black/60 hidden md:block">Verified information</p>
            </div>
          </div>
        </div>
        
        <div 
          ref={imageContainerRef}
          className="flex-1 relative max-w-[250px] md:max-w-sm opacity-0 translate-y-8 transition-all duration-1000 ease-out"
        >
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-gold to-gold/20 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative aspect-square rounded-lg overflow-hidden border border-black/10 bg-gradient-to-br from-gold/10 via-white to-gold/5 flex items-center justify-center">
              <div className="text-center p-8">
                <TrendingUp className="h-16 w-16 text-gold mx-auto mb-4" />
                <p className="text-lg font-medium text-black/80">Financial Community</p>
                <p className="text-sm text-black/60">Grow Together</p>
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white border border-gold/20 flex items-center justify-center">
              <div className="text-center">
                <div className="text-xs text-black/60">Join</div>
                <div className="text-xl font-bold text-gold">20K+</div>
                <div className="text-xs text-black/60">Members</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
