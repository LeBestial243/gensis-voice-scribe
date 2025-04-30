
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { TranscriptionForm } from "./transcription-dialog/TranscriptionForm";
import { TranscriptionActions } from "./transcription-dialog/TranscriptionActions";

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
  const [rawTranscript, setRawTranscript] = useState<string>("");
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTranscriptionError, setHasTranscriptionError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inconsistencies, setInconsistencies] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("professional");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const saveTranscriptionMutation = useMutation({
    mutationFn: async ({ text, folderId, originalText }: { text: string; folderId: string; originalText?: string }) => {
      console.log('Saving transcription to folder:', folderId, 'with text length:', text.length);
      console.log('Has transcription error:', hasTranscriptionError);
      
      const fileName = `Transcription du ${format(new Date(), "dd-MM-yyyy-HH-mm")}${hasTranscriptionError ? ' (À VÉRIFIER)' : ''}`;
      const filePath = `transcriptions/${folderId}/${Date.now()}.txt`;
      
      // 1. Insérer le fichier de métadonnées dans la base de données
      const { data, error } = await supabase
        .from('files')
        .insert({
          folder_id: folderId,
          name: fileName,
          type: hasTranscriptionError ? "transcription_error" : "transcription",
          size: new Blob([text]).size,
          path: filePath,
          content: text, // Texte reformulé
          // Ici, on pourrait également stocker le texte original et les incohérences
          // si la structure de la base de données le permet
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      // 2. Aussi stocker le contenu dans le stockage Supabase pour la redondance
      try {
        // Créer le chemin du dossier avant de tenter l'upload
        const folderPath = `transcriptions/${folderId}`;
        
        // Vérifier si le dossier existe et le créer si nécessaire
        try {
          const { data: folderExists } = await supabase.storage.from('files').list(folderPath);
          if (!folderExists || folderExists.length === 0) {
            // Le dossier n'existe pas, on crée un fichier placeholder pour créer le dossier
            await supabase.storage.from('files').upload(`${folderPath}/.placeholder`, new Blob(['']), {
              contentType: 'text/plain',
              upsert: true
            });
          }
        } catch (folderErr) {
          console.warn('Error checking folder, will attempt to create it:', folderErr);
        }
        
        // Maintenant on peut uploader le fichier
        const { error: storageError } = await supabase
          .storage
          .from('files')
          .upload(filePath, new Blob([text]), {
            contentType: 'text/plain',
            upsert: true
          });
          
        if (storageError) {
          console.warn('Storage upload warning (continuing anyway):', storageError);
          // On continue même si le stockage échoue car nous avons le contenu dans la DB
        }
      } catch (storageErr) {
        console.warn('Storage error (continuing anyway):', storageErr);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', selectedFolderId] });
      queryClient.invalidateQueries({ queryKey: ['folders_file_count'] }); 
      
      const message = hasTranscriptionError 
        ? "Transcription enregistrée avec indicateur d'erreur"
        : "Transcription enregistrée avec succès";
        
      toast({ 
        title: message,
        description: hasTranscriptionError ? "Veuillez vérifier et corriger si nécessaire" : undefined,
        variant: hasTranscriptionError ? "destructive" : "default"
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

  const handleTranscriptionComplete = (
    text: string, 
    audioUrl: string | null, 
    hasError: boolean = false, 
    errorMsg: string | null = null,
    detectedInconsistencies: string[] = []
  ) => {
    setTranscript(text);
    setAudioURL(audioUrl);
    setIsTranscribing(false);
    setError(null);
    setHasTranscriptionError(hasError);
    setErrorMessage(errorMsg);
    setInconsistencies(detectedInconsistencies || []);
    
    // Si nous avons reçu un texte brut et un texte traité
    if (text && text !== rawTranscript) {
      setRawTranscript(text); // Par défaut, mettre le même texte
    }
  };

  const handleTranscriptionStart = () => {
    setIsTranscribing(true);
    setError(null);
    setInconsistencies([]);
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

    // Si une erreur de transcription est détectée, demander confirmation
    if (hasTranscriptionError) {
      const confirmed = confirm("Cette transcription semble contenir des erreurs ou des incohérences. Voulez-vous quand même l'enregistrer ?");
      if (!confirmed) {
        return;
      }
    }

    saveTranscriptionMutation.mutate({ 
      text: transcript, 
      folderId: selectedFolderId,
      originalText: rawTranscript !== transcript ? rawTranscript : undefined
    });
  };

  const handleReset = () => {
    setTranscript("");
    setRawTranscript("");
    setAudioURL(null);
    setSelectedFolderId("");
    setError(null);
    setHasTranscriptionError(false);
    setErrorMessage(null);
    setInconsistencies([]);
    setActiveTab("professional");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      if (!isTranscribing) {
        handleReset();
      }
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Enregistrer une observation</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {!transcript ? (
            <VoiceRecorder 
              onTranscriptionComplete={handleTranscriptionComplete} 
              onTranscriptionStart={handleTranscriptionStart}
              youngProfile={youngProfile}
            />
          ) : (
            <TranscriptionForm 
              transcript={transcript}
              setTranscript={setTranscript}
              selectedFolderId={selectedFolderId}
              setSelectedFolderId={setSelectedFolderId}
              audioURL={audioURL}
              hasTranscriptionError={hasTranscriptionError}
              errorMessage={errorMessage}
              inconsistencies={inconsistencies}
              folders={folders}
              error={error}
            />
          )}
        </div>
        
        {transcript && (
          <TranscriptionActions
            onSave={handleSaveTranscription}
            onCancel={handleReset}
            isPending={saveTranscriptionMutation.isPending}
            hasError={hasTranscriptionError}
            hasSelectedFolder={!!selectedFolderId}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
