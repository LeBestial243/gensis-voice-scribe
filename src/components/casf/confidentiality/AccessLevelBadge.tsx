
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfidentialityLevel } from "@/types/confidentiality";
import { Lock, Shield, Eye, Users } from "lucide-react";

interface AccessLevelBadgeProps {
  level: ConfidentialityLevel;
  showLabel?: boolean;
  className?: string;
}

export function AccessLevelBadge({ level, showLabel = true, className }: AccessLevelBadgeProps) {
  const getVariant = (level: ConfidentialityLevel) => {
    switch (level) {
      case "public": return "outline";
      case "restricted": return "secondary";
      case "confidential": return "default";
      case "strict": return "destructive";
      default: return "outline";
    }
  };
  
  const getIcon = (level: ConfidentialityLevel) => {
    switch (level) {
      case "public": return <Users className="h-3 w-3" />;
      case "restricted": return <Eye className="h-3 w-3" />;
      case "confidential": return <Shield className="h-3 w-3" />;
      case "strict": return <Lock className="h-3 w-3" />;
      default: return <Eye className="h-3 w-3" />;
    }
  };
  
  const getLabel = (level: ConfidentialityLevel) => {
    switch (level) {
      case "public": return "Public";
      case "restricted": return "Restreint";
      case "confidential": return "Confidentiel";
      case "strict": return "Strict";
      default: return "Public";
    }
  };
  
  const getDescription = (level: ConfidentialityLevel) => {
    switch (level) {
      case "public": return "Accessible à tous les intervenants";
      case "restricted": return "Accessible aux intervenants directs et superviseurs";
      case "confidential": return "Accessible uniquement aux intervenants autorisés";
      case "strict": return "Accessible uniquement au référent et à la direction";
      default: return "Accessible à tous les intervenants";
    }
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={getVariant(level)} className={className}>
            {getIcon(level)}
            {showLabel && <span className="ml-1">{getLabel(level)}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getDescription(level)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
