
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { confidentialityLevels, ConfidentialityLevel } from '@/types/confidentiality';
import { AccessLevelBadge } from './AccessLevelBadge';

interface ConfidentialityManagerProps {
  value: ConfidentialityLevel;
  onChange: (value: ConfidentialityLevel) => void;
  showDescription?: boolean;
}

export function ConfidentialityManager({ 
  value, 
  onChange,
  showDescription = true 
}: ConfidentialityManagerProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor="confidentiality">Niveau de confidentialité</Label>
        <AccessLevelBadge level={value} />
      </div>
      
      <Select value={value} onValueChange={(value: ConfidentialityLevel) => onChange(value)}>
        <SelectTrigger id="confidentiality" className="w-full">
          <SelectValue placeholder="Sélectionner un niveau" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(confidentialityLevels).map(([key, { label, description, color }]) => (
            <SelectItem key={key} value={key || 'default'} className="flex items-center py-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <span>{label}</span>
                </div>
                {showDescription && (
                  <span className="text-xs text-muted-foreground mt-1">{description}</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
