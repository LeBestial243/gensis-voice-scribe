
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { TranscriptionForm } from "./TranscriptionForm";
import { AudioPreview } from "./AudioPreview";
import { FolderSelector } from "./FolderSelector";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useTranscription } from "@/hooks/use-transcription";

interface Folder {
  id: string;
  title: string;
}

interface TranscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  folders: Folder[];
  youngProfile?: any;
}

export function TranscriptionDialog({ 
  open, 
  onOpenChange, 
  profileId, 
  folders,
  youngProfile 
}: TranscriptionDialogProps) {
  const {
    transcript,
    setTranscript,
    audioURL,
    selectedFolderId,
    setSelectedFolderId,
    isTranscribing,
    error,
    hasTranscriptionError,
    isPending,
    handleTranscriptionComplete,
    handleTranscriptionStart,
    handleSaveTranscription,
    handleReset
  } = useTranscription({
    onClose: () => onOpenChange(false)
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isTranscribing) {
      handleReset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enregistrer une observation</DialogTitle>
        </DialogHeader>
        {!transcript ? (
          <VoiceRecorder 
            onTranscriptionComplete={handleTranscriptionComplete} 
            onTranscriptionStart={handleTranscriptionStart}
            youngProfile={youngProfile}
          />
        ) : (
          <div className="space-y-4">
            <TranscriptionForm
              transcript={transcript}
              onTranscriptChange={setTranscript}
              error={error}
              hasError={hasTranscriptionError}
              currentDate={format(new Date(), "PPP 'à' HH:mm", { locale: fr })}
            />
            
            <AudioPreview 
              audioURL={audioURL}
              hasError={hasTranscriptionError} 
            />
            
            <FolderSelector
              folders={folders}
              selectedFolderId={selectedFolderId}
              onFolderSelect={setSelectedFolderId}
              hasError={hasTranscriptionError}
            />
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleSaveTranscription}
                disabled={isPending || !selectedFolderId}
                variant={hasTranscriptionError ? "destructive" : "default"}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  hasTranscriptionError ? "Valider malgré l'erreur" : "Valider et classer"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
