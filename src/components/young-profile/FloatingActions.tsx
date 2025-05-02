import { Button } from "@/components/ui/button";
import { Mic, FileText, Heart } from "lucide-react";

interface FloatingActionsProps {
  onRecordingClick: () => void;
  onGenerateNoteClick?: () => void;
  onEmotionalAnalysisClick?: () => void;
  profileId?: string;
}

export function FloatingActions({
  onRecordingClick,
  onGenerateNoteClick,
  onEmotionalAnalysisClick,
  profileId
}: FloatingActionsProps) {
  return (
    <div className="fixed bottom-20 right-4 z-50 sm:right-8 sm:bottom-8">
      <div className="flex flex-col gap-2">
        <Button
          onClick={onRecordingClick}
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg bg-gradient-to-r from-primary to-primary/80"
        >
          <Mic className="h-5 w-5" />
          <span className="sr-only">Enregistrer une transcription</span>
        </Button>
        
        {onGenerateNoteClick && (
          <Button
            onClick={onGenerateNoteClick}
            size="icon"
            variant="outline"
            className="h-12 w-12 rounded-full shadow-lg border-2"
          >
            <FileText className="h-5 w-5" />
            <span className="sr-only">Générer une note</span>
          </Button>
        )}
        
        {profileId && onEmotionalAnalysisClick && (
          <Button
            onClick={onEmotionalAnalysisClick}
            size="icon"
            variant="outline"
            className="h-12 w-12 rounded-full shadow-lg border-2"
          >
            <Heart className="h-5 w-5" />
            <span className="sr-only">Analyse émotionnelle</span>
          </Button>
        )}
      </div>
    </div>
  );
}
