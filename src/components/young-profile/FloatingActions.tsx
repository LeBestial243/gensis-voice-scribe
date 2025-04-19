
import { Button } from "@/components/ui/button";

interface FloatingActionsProps {
  onRecordingClick: () => void;
  onGenerateNoteClick: () => void;
}

export function FloatingActions({ onRecordingClick, onGenerateNoteClick }: FloatingActionsProps) {
  // Add a wrapper function to log and call the original function
  const handleGenerateNoteClick = () => {
    console.log('Generate note button clicked in FloatingActions');
    onGenerateNoteClick();
  };
  
  return (
    <>
      <Button
        onClick={onRecordingClick}
        className="fixed bottom-24 left-1/2 transform -translate-x-1/2 rounded-full h-16 w-16 shadow-lg flex items-center justify-center bg-primary"
        size="icon"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
      </Button>

      <Button
        className="fixed bottom-24 right-4 bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg"
        size="lg"
        onClick={handleGenerateNoteClick}
      >
        Générer une note IA
      </Button>
    </>
  );
}
