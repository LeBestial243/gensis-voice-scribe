
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { confidentialityLevels, ConfidentialityLevel } from "@/types/confidentiality";

interface ResourceConfidentialitySelectorProps {
  value: ConfidentialityLevel;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * Dropdown selector for confidentiality levels
 * Displays each level with its corresponding color indicator
 */
export function ResourceConfidentialitySelector({ 
  value, 
  onChange, 
  disabled = false 
}: ResourceConfidentialitySelectorProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(confidentialityLevels).map(([level, { label, color }]) => (
          <SelectItem 
            key={level} 
            value={level} 
            className="flex items-center"
          >
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${color}`}></span>
              <span>{label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
