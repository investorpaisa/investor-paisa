import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Search, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthGateModal } from '@/components/auth/AuthGateModal';
import { LandingFeedPreview } from '@/components/landing/LandingFeedPreview';
import { trackEvents } from '@/services/analytics/googleAnalytics';
import { useSearch } from '@/hooks/useSearch';
import { Card } from '@/components/ui/card';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const { data: searchResults, isLoading: searchLoading } = useSearch(searchQuery, 3);

  // Track landing page view
  useEffect(() => {
    trackEvents.landingView();
  }, []);

  // Redirect to feed if already logged in
  useEffect(() => {
    if (user) {
      navigate('/feed');
    }
  }, [user, navigate]);

  const handleStartCTA = () => {
    setShowAuthGate(true);
  };

  const handleAuthGate = () => {
    setShowAuthGate(true);
  };

  const handleSearchResultClick = (type: string, id: string) => {
    // Gate all interactions for logged-out users
    handleAuthGate();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.8, staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
  };

  const hasSearchResults = searchResults && (
    searchResults.posts.length > 0 || 
    searchResults.users.length > 0 || 
    searchResults.topics.length > 0
  );

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden pb-20">
      {/* Animated gradient noise background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[120px]"
          animate={{ 
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]"
          animate={{ 
            x: [0, -40, 0],
            y: [0, -40, 0],
            scale: [1, 1.15, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-primary/4 rounded-full blur-[80px]"
          animate={{ 
            x: [0, -30, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Header with Search */}
      <header className="relative z-20 px-4 sm:px-6 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo - Left */}
          <div className="flex items-center shrink-0">
            <span className="font-bold text-lg sm:text-xl font-heading">
              Investor<span className="text-primary">Paisa</span>
            </span>
          </div>
          
          {/* Search - Center */}
          <div className="hidden sm:flex flex-1 max-w-md mx-auto relative">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search posts, people, topics..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(e.target.value.length > 0);
                }}
                onFocus={() => searchQuery.length > 0 && setShowSearchResults(true)}
                className="pl-10 pr-10 bg-secondary/50 border-border/50 focus:border-primary/50 h-10"
              />
              {searchQuery && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
              
              {/* Search Results Dropdown */}
              <AnimatePresence>
                {showSearchResults && searchQuery.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 z-50"
                  >
                    <Card className="p-3 bg-card border-border/50 shadow-lg max-h-80 overflow-y-auto">
                      {searchLoading ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Searching...</p>
                      ) : !hasSearchResults ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No results found</p>
                      ) : (
                        <div className="space-y-3">
                          {searchResults.posts.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-2">Posts</p>
                              {searchResults.posts.map((post) => (
                                <button
                                  key={post.id}
                                  onClick={() => handleSearchResultClick('post', post.id)}
                                  className="w-full text-left p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                                >
                                  <p className="text-sm font-medium line-clamp-1">{post.title || 'Untitled'}</p>
                                </button>
                              ))}
                            </div>
                          )}
                          
                          {searchResults.users.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-2">People</p>
                              {searchResults.users.map((user) => (
                                <button
                                  key={user.id}
                                  onClick={() => handleSearchResultClick('user', user.id)}
                                  className="w-full text-left p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                                >
                                  <p className="text-sm">@{user.username}</p>
                                </button>
                              ))}
                            </div>
                          )}
                          
                          {searchResults.topics.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-2">Topics</p>
                              {searchResults.topics.map((topic) => (
                                <button
                                  key={topic.id}
                                  onClick={() => handleSearchResultClick('topic', topic.id)}
                                  className="w-full text-left p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                                >
                                  <p className="text-sm">{topic.name}</p>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {/* Empty right side to balance header */}
          <div className="w-20 hidden sm:block" />
        </div>
        
        {/* Mobile search */}
        <div className="sm:hidden mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search posts, people, topics..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(e.target.value.length > 0);
            }}
            className="pl-10 bg-secondary/50 border-border/50"
          />
        </div>
      </header>

      {/* Hero Section */}
      <motion.section 
        className="relative z-10 pt-8 sm:pt-16 pb-8 sm:pb-12 px-4 sm:px-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 
            className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 leading-tight font-heading"
            variants={itemVariants}
          >
            Ask anything about{' '}
            <span className="gradient-text">money.</span>
          </motion.h1>
          
          <motion.p 
            className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 sm:mb-12"
            variants={itemVariants}
          >
            AI + community + experts.
          </motion.p>
        </div>
      </motion.section>

      {/* Limited Pulse Feed Preview (first 10 items, read-only) */}
      <motion.section
        className="relative z-10 px-4 sm:px-6 pb-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        <div className="max-w-2xl mx-auto">
          <LandingFeedPreview onAuthRequired={handleAuthGate} />
        </div>
      </motion.section>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-md mx-auto">
          <motion.div 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              size="lg" 
              onClick={handleStartCTA}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6 h-auto rounded-2xl glow-primary font-semibold"
            >
              Start
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Auth Gate Modal */}
      <AuthGateModal 
        isOpen={showAuthGate} 
        onClose={() => setShowAuthGate(false)} 
        title="Create free account to interact"
      />
    </div>
  );
};

export default Landing;
