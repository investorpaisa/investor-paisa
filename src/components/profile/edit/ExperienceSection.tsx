import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Briefcase, Plus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { Experience } from '@/hooks/useEditProfile';

interface ExperienceSectionProps {
  experiences: Experience[];
  onUpdate: (experiences: Experience[]) => void;
}

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 50 }, (_, i) => currentYear - i);

const emptyExperience: Experience = {
  title: '',
  company: '',
  location: '',
  start_month: undefined,
  start_year: undefined,
  end_month: undefined,
  end_year: undefined,
  is_current: false,
  description: '',
  _isNew: true,
};

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  experiences,
  onUpdate,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const visibleExperiences = experiences.filter(e => !e._isDeleted);

  const handleAdd = () => {
    const newExp = { ...emptyExperience, id: `new-${Date.now()}` };
    onUpdate([...experiences, newExp]);
    setEditingId(newExp.id!);
    setExpandedId(newExp.id!);
  };

  const handleUpdate = (id: string, updates: Partial<Experience>) => {
    onUpdate(experiences.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const handleDelete = (id: string) => {
    const exp = experiences.find(e => e.id === id);
    if (exp?._isNew) {
      // Remove completely if never saved
      onUpdate(experiences.filter(e => e.id !== id));
    } else {
      // Mark for deletion
      onUpdate(experiences.map(e => e.id === id ? { ...e, _isDeleted: true } : e));
    }
    setEditingId(null);
    setExpandedId(null);
  };

  const formatDateRange = (exp: Experience) => {
    const startMonth = exp.start_month ? MONTHS.find(m => m.value === exp.start_month)?.label.slice(0, 3) : '';
    const start = exp.start_year ? `${startMonth} ${exp.start_year}` : '';
    if (exp.is_current) return start ? `${start} - Present` : 'Present';
    const endMonth = exp.end_month ? MONTHS.find(m => m.value === exp.end_month)?.label.slice(0, 3) : '';
    const end = exp.end_year ? `${endMonth} ${exp.end_year}` : '';
    return start && end ? `${start} - ${end}` : start || end || '';
  };

  return (
    <Card className="glass border-border/50 rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-base sm:text-lg font-semibold">
            <Briefcase className="h-5 w-5 mr-2 text-primary" />
            Experience
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            className="h-8 px-3 border-primary/50 text-primary hover:bg-primary/10"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleExperiences.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No experience added yet. Add your work history to build credibility.
          </p>
        ) : (
          visibleExperiences.map((exp) => (
            <Collapsible
              key={exp.id}
              open={expandedId === exp.id}
              onOpenChange={(open) => setExpandedId(open ? exp.id! : null)}
            >
              <div className="border border-border/50 rounded-xl overflow-hidden bg-secondary/30">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-secondary/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {exp.title || 'New Experience'}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {exp.company}{exp.company && formatDateRange(exp) ? ' • ' : ''}{formatDateRange(exp)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(editingId === exp.id ? null : exp.id!);
                          setExpandedId(exp.id!);
                        }}
                        className="h-7 w-7 p-0"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(exp.id!);
                        }}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      {expandedId === exp.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="p-3 pt-0 space-y-3 border-t border-border/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Job Title *</Label>
                        <Input
                          value={exp.title}
                          onChange={(e) => handleUpdate(exp.id!, { title: e.target.value })}
                          placeholder="e.g., Senior Analyst"
                          className="h-9 text-sm bg-secondary/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Company *</Label>
                        <Input
                          value={exp.company}
                          onChange={(e) => handleUpdate(exp.id!, { company: e.target.value })}
                          placeholder="e.g., Goldman Sachs"
                          className="h-9 text-sm bg-secondary/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Location</Label>
                      <Input
                        value={exp.location || ''}
                        onChange={(e) => handleUpdate(exp.id!, { location: e.target.value })}
                        placeholder="e.g., Mumbai, India"
                        className="h-9 text-sm bg-secondary/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Start Month</Label>
                        <select
                          value={exp.start_month || ''}
                          onChange={(e) => handleUpdate(exp.id!, { start_month: e.target.value ? parseInt(e.target.value) : undefined })}
                          className="flex h-9 w-full rounded-md border border-border/50 bg-secondary/50 px-2 py-1 text-xs"
                        >
                          <option value="">Month</option>
                          {MONTHS.map(m => (
                            <option key={m.value} value={m.value}>{m.label.slice(0, 3)}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Start Year</Label>
                        <select
                          value={exp.start_year || ''}
                          onChange={(e) => handleUpdate(exp.id!, { start_year: e.target.value ? parseInt(e.target.value) : undefined })}
                          className="flex h-9 w-full rounded-md border border-border/50 bg-secondary/50 px-2 py-1 text-xs"
                        >
                          <option value="">Year</option>
                          {YEARS.map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">End Month</Label>
                        <select
                          value={exp.end_month || ''}
                          onChange={(e) => handleUpdate(exp.id!, { end_month: e.target.value ? parseInt(e.target.value) : undefined })}
                          disabled={exp.is_current}
                          className="flex h-9 w-full rounded-md border border-border/50 bg-secondary/50 px-2 py-1 text-xs disabled:opacity-50"
                        >
                          <option value="">Month</option>
                          {MONTHS.map(m => (
                            <option key={m.value} value={m.value}>{m.label.slice(0, 3)}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">End Year</Label>
                        <select
                          value={exp.end_year || ''}
                          onChange={(e) => handleUpdate(exp.id!, { end_year: e.target.value ? parseInt(e.target.value) : undefined })}
                          disabled={exp.is_current}
                          className="flex h-9 w-full rounded-md border border-border/50 bg-secondary/50 px-2 py-1 text-xs disabled:opacity-50"
                        >
                          <option value="">Year</option>
                          {YEARS.map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`current-${exp.id}`}
                        checked={exp.is_current}
                        onCheckedChange={(checked) => handleUpdate(exp.id!, { 
                          is_current: !!checked,
                          end_month: checked ? undefined : exp.end_month,
                          end_year: checked ? undefined : exp.end_year,
                        })}
                      />
                      <Label htmlFor={`current-${exp.id}`} className="text-xs cursor-pointer">
                        I currently work here
                      </Label>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Description</Label>
                      <textarea
                        value={exp.description || ''}
                        onChange={(e) => handleUpdate(exp.id!, { description: e.target.value })}
                        placeholder="Describe your role and achievements..."
                        rows={3}
                        className="flex w-full rounded-md border border-border/50 bg-secondary/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))
        )}
      </CardContent>
    </Card>
  );
};
