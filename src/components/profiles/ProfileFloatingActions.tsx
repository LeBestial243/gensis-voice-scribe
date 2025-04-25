
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import { TranscriptionDialog } from "@/components/TranscriptionDialog";
import { GenerateNoteDialog } from "@/components/young-profile/generate-note/GenerateNoteDialog";

interface ProfileFloatingActionsProps {
  selectedProfileId: string;
  isRecorderOpen: boolean;
  setIsRecorderOpen: (open: boolean) => void;
  isGenerateNoteOpen: boolean;
  setIsGenerateNoteOpen: (open: boolean) => void;
  folders: any[];
}

export function ProfileFloatingActions({
  selectedProfileId,
  isRecorderOpen,
  setIsRecorderOpen,
  isGenerateNoteOpen,
  setIsGenerateNoteOpen,
  folders
}: ProfileFloatingActionsProps) {
  return (
    <>
      <Button
        onClick={() => setIsRecorderOpen(true)}
        className="fixed bottom-24 left-1/2 transform -translate-x-1/2 rounded-full h-16 w-16 shadow-lg flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600 interactive"
        size="icon"
      >
        <Mic className="h-6 w-6 text-white" />
      </Button>

      <TranscriptionDialog 
        open={isRecorderOpen} 
        onOpenChange={setIsRecorderOpen} 
        profileId={selectedProfileId} 
        folders={folders}
      />

      <Button
        className="fixed bottom-24 right-4 bg-gradient-to-r from-accent to-purple-700 hover:bg-purple-700 interactive text-white shadow-lg"
        size="lg"
        onClick={() => {
          console.log('Generate note button clicked in Profiles');
          setIsGenerateNoteOpen(true);
        }}
      >
        Générer une note IA
      </Button>

      {selectedProfileId && (
        <GenerateNoteDialog
          open={isGenerateNoteOpen}
          onOpenChange={setIsGenerateNoteOpen}
          profileId={selectedProfileId}
        />
      )}
    </>
  );
}
