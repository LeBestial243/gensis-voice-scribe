import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { TranscriptionForm } from "./TranscriptionForm";
import { AudioPreview } from "./AudioPreview";
import { FolderSelector } from "./FolderSelector";
import { checkTranscriptionError } from "@/utils/transcription-utils";

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
  const [transcript, setTranscript] = useState<string>("");
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcriptionError, setTranscriptionError] = useState<boolean>(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentDate = format(new Date(), "PPP 'à' HH:mm", { locale: fr });

  const saveTranscriptionMutation = useMutation({
    mutationFn: async ({ text, folderId, hasError }: { text: string; folderId: string; hasError: boolean }) => {
      console.log('Saving transcription to folder:', folderId, 'with text length:', text.length, 'hasError:', hasError);
      
      const fileName = `Transcription du ${format(new Date(), "dd-MM-yyyy-HH-mm")}${hasError ? ' (ERREUR)' : ''}`;
      const filePath = `transcriptions/${folderId}/${Date.now()}.txt`;
      
      // Insérer le fichier de métadonnées dans la base de données
      const { data, error } = await supabase
        .from('files')
        .insert({
          folder_id: folderId,
          name: fileName,
          type: hasError ? "transcription_error" : "transcription",
          size: new Blob([text]).size,
          path: filePath,
          content: text
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      // Essayer de stocker aussi dans le storage pour la redondance (optionnel)
      try {
        const folderPath = `transcriptions/${folderId}`;
        
        // Créer le dossier si nécessaire
        await supabase.storage
          .from('files')
          .upload(`${folderPath}/.keep`, new Blob([''], { type: 'text/plain' }), {
            upsert: true
          });
        
        // Télécharger le fichier
        await supabase
          .storage
          .from('files')
          .upload(filePath, new Blob([text], { type: 'text/plain' }), {
            contentType: 'text/plain',
            upsert: true
          });
      } catch (storageErr) {
        console.warn('Storage error (continuing anyway):', storageErr);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', selectedFolderId] });
      queryClient.invalidateQueries({ queryKey: ['folders_file_count'] }); 
      
      const message = transcriptionError ? 
        "Transcription avec erreur enregistrée. Veuillez vérifier et corriger si nécessaire." :
        "Transcription enregistrée avec succès";
      
      toast({ 
        title: message,
        variant: transcriptionError ? "destructive" : "default"
      });
      handleReset();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Save error:', error);
      setError(error instanceof Error ? error.message : "Erreur lors de l'enregistrement.");
      toast({
        title: "Erreur lors de l'enregistrement de la transcription",
        description: "Vérifiez la structure de votre base de données",
        variant: "destructive",
      });
    },
  });

  const handleTranscriptionComplete = (text: string, audioUrl: string | null) => {
    setTranscript(text);
    setAudioURL(audioUrl);
    setIsTranscribing(false);
    setError(null);
    setTranscriptionError(checkTranscriptionError(text));
  };

  const handleTranscriptionStart = () => {
    setIsTranscribing(true);
    setError(null);
    setTranscriptionError(false);
  };

  const handleSaveTranscription = () => {
    if (!transcript.trim()) {
      setError("La transcription est vide. Veuillez enregistrer un message ou saisir du texte.");
      toast({
        title: "La transcription est vide",
        description: "Veuillez enregistrer un message ou saisir du texte",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFolderId) {
      setError("Aucun dossier sélectionné. Veuillez sélectionner un dossier.");
      toast({
        title: "Aucun dossier sélectionné",
        description: "Veuillez sélectionner un dossier",
        variant: "destructive",
      });
      return;
    }

    // Si la transcription contient une erreur, demander confirmation
    if (transcriptionError) {
      if (!confirm("Cette transcription semble contenir des erreurs. Voulez-vous quand même la sauvegarder ?")) {
        return;
      }
    }

    saveTranscriptionMutation.mutate({ 
      text: transcript, 
      folderId: selectedFolderId,
      hasError: transcriptionError
    });
  };

  const handleReset = () => {
    setTranscript("");
    setAudioURL(null);
    setSelectedFolderId("");
    setError(null);
    setTranscriptionError(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      if (!isTranscribing) {
        handleReset();
      }
    }
    onOpenChange(newOpen);
  };

  const handleTranscriptChange = (newText: string) => {
    setTranscript(newText);
    setTranscriptionError(checkTranscriptionError(newText));
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
              onTranscriptChange={handleTranscriptChange}
              error={error}
              transcriptionError={transcriptionError}
              currentDate={currentDate}
            />
            
            <AudioPreview audioURL={audioURL} />
            
            <FolderSelector
              folders={folders}
              selectedFolderId={selectedFolderId}
              onFolderSelect={setSelectedFolderId}
            />
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={saveTranscriptionMutation.isPending}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleSaveTranscription}
                disabled={saveTranscriptionMutation.isPending || !selectedFolderId}
                variant={transcriptionError ? "destructive" : "default"}
              >
                {saveTranscriptionMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  transcriptionError ? "Valider malgré l'erreur" : "Valider et classer"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
