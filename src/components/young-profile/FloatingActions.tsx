
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mic, FileText, FileDigit, Activity, FileUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FloatingActionsProps {
  onRecordingClick: () => void;
  onGenerateNoteClick: () => void;
  onEmotionalAnalysisClick: () => void;
  profileId: string;
}

export function FloatingActions({
  onRecordingClick,
  onGenerateNoteClick,
  onEmotionalAnalysisClick,
  profileId
}: FloatingActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleGenerateReportClick = () => {
    navigate(`/official-report/${profileId}`);
  };

  return (
    <div className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-30">
      <div className="flex flex-col items-end space-y-2">
        {isOpen && (
          <>
            <Button
              onClick={onRecordingClick}
              size="icon"
              className="bg-red-500 hover:bg-red-600 shadow-lg"
              aria-label="Enregistrer une transcription"
            >
              <Mic className="h-5 w-5" />
            </Button>
            
            <Button
              onClick={onGenerateNoteClick}
              size="icon"
              className="bg-purple-500 hover:bg-purple-600 shadow-lg"
              aria-label="Générer une note"
            >
              <FileText className="h-5 w-5" />
            </Button>
            
            <Button
              onClick={onEmotionalAnalysisClick}
              size="icon"
              className="bg-blue-500 hover:bg-blue-600 shadow-lg"
              aria-label="Analyse émotionnelle"
            >
              <Activity className="h-5 w-5" />
            </Button>

            <Button
              onClick={handleGenerateReportClick}
              size="icon"
              className="bg-amber-500 hover:bg-amber-600 shadow-lg"
              aria-label="Générer un rapport officiel"
            >
              <FileDigit className="h-5 w-5" />
            </Button>
          </>
        )}
        
        <Button
          onClick={toggleMenu}
          size="lg"
          className="rounded-full shadow-xl h-14 w-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 p-0"
        >
          <FileUp className={`h-6 w-6 transition-transform ${isOpen ? "rotate-45" : ""}`} />
        </Button>
      </div>
    </div>
  );
}
