import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { GraduationCap, Plus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { Education } from '@/hooks/useEditProfile';

interface EducationSectionProps {
  educations: Education[];
  onUpdate: (educations: Education[]) => void;
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
const YEARS = Array.from({ length: 60 }, (_, i) => currentYear - i + 5);

const emptyEducation: Education = {
  school: '',
  degree: '',
  field_of_study: '',
  start_month: undefined,
  start_year: undefined,
  end_month: undefined,
  end_year: undefined,
  is_current: false,
  description: '',
  _isNew: true,
};

export const EducationSection: React.FC<EducationSectionProps> = ({
  educations,
  onUpdate,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const visibleEducations = educations.filter(e => !e._isDeleted);

  const handleAdd = () => {
    const newEdu = { ...emptyEducation, id: `new-${Date.now()}` };
    onUpdate([...educations, newEdu]);
    setExpandedId(newEdu.id!);
  };

  const handleUpdate = (id: string, updates: Partial<Education>) => {
    onUpdate(educations.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const handleDelete = (id: string) => {
    const edu = educations.find(e => e.id === id);
    if (edu?._isNew) {
      onUpdate(educations.filter(e => e.id !== id));
    } else {
      onUpdate(educations.map(e => e.id === id ? { ...e, _isDeleted: true } : e));
    }
    setExpandedId(null);
  };

  const formatDateRange = (edu: Education) => {
    const start = edu.start_year ? `${edu.start_year}` : '';
    if (edu.is_current) return start ? `${start} - Present` : 'Present';
    const end = edu.end_year ? `${edu.end_year}` : '';
    return start && end ? `${start} - ${end}` : start || end || '';
  };

  return (
    <Card className="glass border-border/50 rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-base sm:text-lg font-semibold">
            <GraduationCap className="h-5 w-5 mr-2 text-primary" />
            Education
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
        {visibleEducations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No education added yet. Add your educational background.
          </p>
        ) : (
          visibleEducations.map((edu) => (
            <Collapsible
              key={edu.id}
              open={expandedId === edu.id}
              onOpenChange={(open) => setExpandedId(open ? edu.id! : null)}
            >
              <div className="border border-border/50 rounded-xl overflow-hidden bg-secondary/30">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-secondary/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {edu.school || 'New Education'}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {edu.degree}{edu.degree && edu.field_of_study ? ' in ' : ''}{edu.field_of_study}
                        {(edu.degree || edu.field_of_study) && formatDateRange(edu) ? ' • ' : ''}{formatDateRange(edu)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(expandedId === edu.id ? null : edu.id!);
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
                          handleDelete(edu.id!);
                        }}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      {expandedId === edu.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="p-3 pt-0 space-y-3 border-t border-border/50">
                    <div className="space-y-1.5">
                      <Label className="text-xs">School/University *</Label>
                      <Input
                        value={edu.school}
                        onChange={(e) => handleUpdate(edu.id!, { school: e.target.value })}
                        placeholder="e.g., IIM Ahmedabad"
                        className="h-9 text-sm bg-secondary/50"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Degree</Label>
                        <Input
                          value={edu.degree || ''}
                          onChange={(e) => handleUpdate(edu.id!, { degree: e.target.value })}
                          placeholder="e.g., MBA"
                          className="h-9 text-sm bg-secondary/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Field of Study</Label>
                        <Input
                          value={edu.field_of_study || ''}
                          onChange={(e) => handleUpdate(edu.id!, { field_of_study: e.target.value })}
                          placeholder="e.g., Finance"
                          className="h-9 text-sm bg-secondary/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Start Month</Label>
                        <select
                          value={edu.start_month || ''}
                          onChange={(e) => handleUpdate(edu.id!, { start_month: e.target.value ? parseInt(e.target.value) : undefined })}
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
                          value={edu.start_year || ''}
                          onChange={(e) => handleUpdate(edu.id!, { start_year: e.target.value ? parseInt(e.target.value) : undefined })}
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
                          value={edu.end_month || ''}
                          onChange={(e) => handleUpdate(edu.id!, { end_month: e.target.value ? parseInt(e.target.value) : undefined })}
                          disabled={edu.is_current}
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
                          value={edu.end_year || ''}
                          onChange={(e) => handleUpdate(edu.id!, { end_year: e.target.value ? parseInt(e.target.value) : undefined })}
                          disabled={edu.is_current}
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
                        id={`current-edu-${edu.id}`}
                        checked={edu.is_current}
                        onCheckedChange={(checked) => handleUpdate(edu.id!, { 
                          is_current: !!checked,
                          end_month: checked ? undefined : edu.end_month,
                          end_year: checked ? undefined : edu.end_year,
                        })}
                      />
                      <Label htmlFor={`current-edu-${edu.id}`} className="text-xs cursor-pointer">
                        I am currently studying here
                      </Label>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Description</Label>
                      <textarea
                        value={edu.description || ''}
                        onChange={(e) => handleUpdate(edu.id!, { description: e.target.value })}
                        placeholder="Activities, societies, achievements..."
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
