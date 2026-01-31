import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Award, Plus, Pencil, Trash2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import type { Certification } from '@/hooks/useEditProfile';

interface CertificationsSectionProps {
  certifications: Certification[];
  onUpdate: (certifications: Certification[]) => void;
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
const YEARS = Array.from({ length: 30 }, (_, i) => currentYear - i + 5);

const emptyCertification: Certification = {
  name: '',
  issuing_organization: '',
  issue_month: undefined,
  issue_year: undefined,
  expiry_month: undefined,
  expiry_year: undefined,
  no_expiry: false,
  credential_id: '',
  credential_url: '',
  _isNew: true,
};

export const CertificationsSection: React.FC<CertificationsSectionProps> = ({
  certifications,
  onUpdate,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const visibleCertifications = certifications.filter(c => !c._isDeleted);

  const handleAdd = () => {
    const newCert = { ...emptyCertification, id: `new-${Date.now()}` };
    onUpdate([...certifications, newCert]);
    setExpandedId(newCert.id!);
  };

  const handleUpdate = (id: string, updates: Partial<Certification>) => {
    onUpdate(certifications.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleDelete = (id: string) => {
    const cert = certifications.find(c => c.id === id);
    if (cert?._isNew) {
      onUpdate(certifications.filter(c => c.id !== id));
    } else {
      onUpdate(certifications.map(c => c.id === id ? { ...c, _isDeleted: true } : c));
    }
    setExpandedId(null);
  };

  const formatDate = (month?: number, year?: number) => {
    if (!year) return '';
    const monthName = month ? MONTHS.find(m => m.value === month)?.label.slice(0, 3) : '';
    return monthName ? `${monthName} ${year}` : `${year}`;
  };

  return (
    <Card className="glass border-border/50 rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-base sm:text-lg font-semibold">
            <Award className="h-5 w-5 mr-2 text-primary" />
            Certifications
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
        {visibleCertifications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No certifications added yet. Add your professional certifications.
          </p>
        ) : (
          visibleCertifications.map((cert) => (
            <Collapsible
              key={cert.id}
              open={expandedId === cert.id}
              onOpenChange={(open) => setExpandedId(open ? cert.id! : null)}
            >
              <div className="border border-border/50 rounded-xl overflow-hidden bg-secondary/30">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-secondary/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {cert.name || 'New Certification'}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {cert.issuing_organization}
                        {cert.issuing_organization && cert.issue_year ? ' • ' : ''}
                        {formatDate(cert.issue_month, cert.issue_year)}
                        {cert.no_expiry ? ' • No Expiry' : cert.expiry_year ? ` - ${formatDate(cert.expiry_month, cert.expiry_year)}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {cert.credential_url && (
                        <a
                          href={cert.credential_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="h-7 w-7 p-0 flex items-center justify-center rounded-md hover:bg-secondary/50 text-primary"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(expandedId === cert.id ? null : cert.id!);
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
                          handleDelete(cert.id!);
                        }}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      {expandedId === cert.id ? (
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
                        <Label className="text-xs">Certification Name *</Label>
                        <Input
                          value={cert.name}
                          onChange={(e) => handleUpdate(cert.id!, { name: e.target.value })}
                          placeholder="e.g., CFA Level I"
                          className="h-9 text-sm bg-secondary/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Issuing Organization *</Label>
                        <Input
                          value={cert.issuing_organization}
                          onChange={(e) => handleUpdate(cert.id!, { issuing_organization: e.target.value })}
                          placeholder="e.g., CFA Institute"
                          className="h-9 text-sm bg-secondary/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Issue Month</Label>
                        <select
                          value={cert.issue_month || ''}
                          onChange={(e) => handleUpdate(cert.id!, { issue_month: e.target.value ? parseInt(e.target.value) : undefined })}
                          className="flex h-9 w-full rounded-md border border-border/50 bg-secondary/50 px-2 py-1 text-xs"
                        >
                          <option value="">Month</option>
                          {MONTHS.map(m => (
                            <option key={m.value} value={m.value}>{m.label.slice(0, 3)}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Issue Year</Label>
                        <select
                          value={cert.issue_year || ''}
                          onChange={(e) => handleUpdate(cert.id!, { issue_year: e.target.value ? parseInt(e.target.value) : undefined })}
                          className="flex h-9 w-full rounded-md border border-border/50 bg-secondary/50 px-2 py-1 text-xs"
                        >
                          <option value="">Year</option>
                          {YEARS.map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Expiry Month</Label>
                        <select
                          value={cert.expiry_month || ''}
                          onChange={(e) => handleUpdate(cert.id!, { expiry_month: e.target.value ? parseInt(e.target.value) : undefined })}
                          disabled={cert.no_expiry}
                          className="flex h-9 w-full rounded-md border border-border/50 bg-secondary/50 px-2 py-1 text-xs disabled:opacity-50"
                        >
                          <option value="">Month</option>
                          {MONTHS.map(m => (
                            <option key={m.value} value={m.value}>{m.label.slice(0, 3)}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Expiry Year</Label>
                        <select
                          value={cert.expiry_year || ''}
                          onChange={(e) => handleUpdate(cert.id!, { expiry_year: e.target.value ? parseInt(e.target.value) : undefined })}
                          disabled={cert.no_expiry}
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
                        id={`no-expiry-${cert.id}`}
                        checked={cert.no_expiry}
                        onCheckedChange={(checked) => handleUpdate(cert.id!, { 
                          no_expiry: !!checked,
                          expiry_month: checked ? undefined : cert.expiry_month,
                          expiry_year: checked ? undefined : cert.expiry_year,
                        })}
                      />
                      <Label htmlFor={`no-expiry-${cert.id}`} className="text-xs cursor-pointer">
                        This certification doesn't expire
                      </Label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Credential ID</Label>
                        <Input
                          value={cert.credential_id || ''}
                          onChange={(e) => handleUpdate(cert.id!, { credential_id: e.target.value })}
                          placeholder="e.g., ABC123XYZ"
                          className="h-9 text-sm bg-secondary/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Credential URL</Label>
                        <Input
                          value={cert.credential_url || ''}
                          onChange={(e) => handleUpdate(cert.id!, { credential_url: e.target.value })}
                          placeholder="https://..."
                          className="h-9 text-sm bg-secondary/50"
                        />
                      </div>
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
