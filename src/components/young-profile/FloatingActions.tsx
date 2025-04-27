
import { Button } from "@/components/ui/button";
import { FileText, Mic } from "lucide-react";

interface FloatingActionsProps {
  onRecordingClick: () => void;
  onGenerateNoteClick: () => void;
}

export function FloatingActions({ onRecordingClick, onGenerateNoteClick }: FloatingActionsProps) {
  return (
    <>
      <Button
        onClick={onRecordingClick}
        className="fixed bottom-24 left-1/2 transform -translate-x-1/2 rounded-full h-16 w-16 shadow-lg flex items-center justify-center bg-primary hover:bg-primary/90"
        size="icon"
      >
        <Mic className="h-6 w-6 text-white" />
      </Button>

      <Button
        onClick={onGenerateNoteClick}
        className="fixed bottom-24 right-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 gap-2"
        size="lg"
      >
        <FileText className="h-5 w-5" />
        Générer une note IA
      </Button>
    </>
  );
}
