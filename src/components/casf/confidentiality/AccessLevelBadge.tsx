
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { confidentialityLevels, ConfidentialityLevel } from '@/types/confidentiality';

interface AccessLevelBadgeProps {
  level: ConfidentialityLevel | string;
  showDescription?: boolean;
}

export function AccessLevelBadge({ 
  level, 
  showDescription = false 
}: AccessLevelBadgeProps) {
  // Default to 'public' if the level is not recognized
  const levelKey = Object.keys(confidentialityLevels).includes(level as string) 
    ? level as ConfidentialityLevel 
    : 'public';
  
  const { label, description, color } = confidentialityLevels[levelKey];

  return (
    <div className="flex items-center gap-2">
      <Badge className={`${color} text-white`}>
        {label}
      </Badge>
      {showDescription && (
        <span className="text-sm text-muted-foreground">{description}</span>
      )}
    </div>
  );
}
