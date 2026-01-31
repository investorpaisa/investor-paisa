import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, X } from 'lucide-react';
import { useSkillSuggestions } from '@/hooks/useEditProfile';

interface SkillsSectionProps {
  skills: string[];
  onUpdate: (skills: string[]) => void;
}

const MAX_SKILLS = 20;

export const SkillsSection: React.FC<SkillsSectionProps> = ({
  skills,
  onUpdate,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: suggestions = [] } = useSkillSuggestions(inputValue);

  // Filter out already added skills from suggestions
  const filteredSuggestions = suggestions.filter(
    s => !skills.some(existing => existing.toLowerCase() === s.toLowerCase())
  );

  const handleAdd = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    if (skills.length >= MAX_SKILLS) return;
    if (skills.some(s => s.toLowerCase() === trimmed.toLowerCase())) return;

    onUpdate([...skills, trimmed]);
    setInputValue('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleRemove = (index: number) => {
    onUpdate(skills.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      handleAdd(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && skills.length > 0) {
      handleRemove(skills.length - 1);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <Card className="glass border-border/50 rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-base sm:text-lg font-semibold">
            <Lightbulb className="h-5 w-5 mr-2 text-primary" />
            Skills & Expertise
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {skills.length}/{MAX_SKILLS}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Skills chips */}
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <Badge
              key={`${skill}-${index}`}
              variant="secondary"
              className="h-7 pl-3 pr-1.5 gap-1.5 bg-primary/10 text-primary border-primary/30"
            >
              {skill}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="rounded-full hover:bg-primary/20 p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>

        {/* Input with autocomplete */}
        <div ref={containerRef} className="relative">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder={skills.length >= MAX_SKILLS ? 'Maximum skills reached' : 'Type a skill and press Enter'}
            disabled={skills.length >= MAX_SKILLS}
            className="bg-secondary/50 border-border/50"
          />
          
          {/* Suggestions dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 py-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleAdd(suggestion)}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-secondary/50 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Add up to {MAX_SKILLS} skills. Type and press Enter, or select from suggestions.
        </p>
      </CardContent>
    </Card>
  );
};
