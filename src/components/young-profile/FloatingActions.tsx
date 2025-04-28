
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, Mic, FileText } from "lucide-react";
import { useState } from "react";

interface FloatingActionsProps {
  onRecordingClick: () => void;
  onGenerateNoteClick: () => void;
}

export function FloatingActions({ 
  onRecordingClick, 
  onGenerateNoteClick 
}: FloatingActionsProps) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="fixed bottom-10 right-10 z-50">
      <div className={cn("relative group", expanded && "is-expanded")}>
        {/* Halo d'arrière-plan */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-r from-gensys-primary-from to-gensys-primary-to rounded-full blur",
          "opacity-70 group-hover:opacity-100 transition-opacity",
          "scale-75 group-hover:scale-90",
          "transition-all duration-300"
        )}></div>
        
        {/* Bouton principal */}
        <Button
          size="lg"
          className="relative bg-white/90 backdrop-blur-md text-gensys-primary-to border-white/20 shadow-xl rounded-full h-14 w-14 p-0"
          onClick={() => setExpanded(!expanded)}
        >
          <Plus className={cn(
            "h-6 w-6 transition-transform duration-300",
            expanded && "rotate-45"
          )} />
        </Button>
        
        {/* Menu actions */}
        <div className={cn(
          "absolute bottom-full right-0 mb-4 transition-all duration-300",
          "flex flex-col gap-3 items-end",
          expanded ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-2 pointer-events-none"
        )}>
          {/* Action d'enregistrement */}
          <div className="relative">
            <div className="absolute inset-0 bg-gensys-primary-from/20 rounded-full blur-sm"></div>
            <Button
              size="sm"
              className="relative bg-white/90 backdrop-blur-md text-gensys-primary-from border-white/20 shadow-lg rounded-full h-10 w-10 p-0"
              onClick={() => {
                onRecordingClick();
                setExpanded(false);
              }}
            >
              <Mic className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Action de génération de note */}
          <div className="relative">
            <div className="absolute inset-0 bg-gensys-primary-to/20 rounded-full blur-sm"></div>
            <Button
              size="sm"
              className="relative bg-white/90 backdrop-blur-md text-gensys-primary-to border-white/20 shadow-lg rounded-full h-10 w-10 p-0"
              onClick={() => {
                onGenerateNoteClick();
                setExpanded(false);
              }}
            >
              <FileText className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
