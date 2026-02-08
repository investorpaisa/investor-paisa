import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { SearchTypeahead } from '@/components/search/SearchTypeahead';

export const MobileTopBar: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Listen for focusSearch event (triggered by Find People button)
  useEffect(() => {
    const handleFocusSearch = () => {
      setShowSearch(true);
      // Focus after state update
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    };

    window.addEventListener('focusSearch', handleFocusSearch);
    return () => window.removeEventListener('focusSearch', handleFocusSearch);
  }, []);

  return (
    <header className="sticky top-0 z-40 glass border-b border-border/50">
      <div className="flex items-center justify-between h-12 px-2">
        {/* Logo - Text only */}
        {!showSearch && (
          <div 
            className="flex items-center cursor-pointer"
            onClick={() => navigate('/feed')}
          >
            <span className="text-lg font-bold font-heading">
              Investor<span className="text-primary">Paisa</span>
            </span>
          </div>
        )}

        {/* Search (expanded) */}
        {showSearch ? (
          <div className="flex-1 flex items-center gap-2 relative">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(e.target.value.length > 0);
                }}
                className="pl-10 bg-secondary/50 border-border/50 rounded-xl h-10"
                autoFocus
              />
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                setShowSearch(false);
                setSearchQuery('');
                setShowSearchResults(false);
              }}
            >
              <X className="h-5 w-5" />
            </Button>
            {showSearchResults && (
              <SearchTypeahead 
                query={searchQuery} 
                onClose={() => setShowSearchResults(false)}
                onResultClick={() => {
                  setShowSearch(false);
                  setShowSearchResults(false);
                  setSearchQuery('');
                }}
              />
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              className="h-9 w-9 rounded-lg"
              onClick={() => setShowSearch(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
            {user && (
              <Button 
                variant="ghost" 
                size="icon"
                className="h-9 w-9 rounded-lg"
                onClick={() => navigate('/messages')}
              >
                <MessageCircle className="h-5 w-5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
