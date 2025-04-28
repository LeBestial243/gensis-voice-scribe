
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  suggestions?: string[];
}

export function SearchInput({ 
  value, 
  onChange, 
  placeholder = "Rechercher...", 
  className,
  suggestions = []
}: SearchInputProps) {
  const [focused, setFocused] = useState(false);
  const filteredSuggestions = value ? 
    suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase())).slice(0, 5) : 
    [];

  return (
    <div className={cn("relative", className)}>
      <div className={cn(
        "absolute inset-0 rounded-full blur",
        focused ? "bg-gradient-to-r from-gensys-primary-from/10 to-gensys-primary-to/10" : "bg-gray-100/50"
      )}></div>
      
      <div className={cn(
        "relative flex items-center bg-white/80 backdrop-blur-sm rounded-full border shadow-inner px-2 transition-all duration-300",
        focused ? "border-gensys-primary-to/50 ring-2 ring-gensys-primary-to/20" : "border-white/30"
      )}>
        <Search className="h-4 w-4 text-gray-400 mx-2" />
        <Input
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 100)}
          className="border-none shadow-none bg-transparent w-full py-2 focus-visible:ring-0"
        />
        {value && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onChange("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {focused && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 py-2 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
          {filteredSuggestions.map((suggestion, i) => (
            <button
              key={i}
              className="w-full text-left px-4 py-2 hover:bg-gensys-primary-from/10 transition-colors"
              onClick={() => {
                onChange(suggestion);
                setFocused(false);
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
