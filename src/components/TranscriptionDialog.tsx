
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Folder {
  id: string;
  title: string;
}

interface TranscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  folders: Folder[];
  youngProfile?: any; // Add youngProfile prop
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
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const currentDate = format(new Date(), "PPP 'à' HH:mm", { locale: fr });

  const saveTranscriptionMutation = useMutation({
    mutationFn: async ({ text, folderId }: { text: string; folderId: string }) => {
      console.log('Saving transcription to folder:', folderId, 'with text length:', text.length);
      
      const fileName = `Transcription du ${format(new Date(), "dd-MM-yyyy-HH-mm")}`;
      const filePath = `transcriptions/${folderId}/${Date.now()}.txt`;
      
      // 1. Insérer le fichier de métadonnées dans la base de données
      const { data, error } = await supabase
        .from('files')
        .insert({
          folder_id: folderId,
          name: fileName,
          type: "transcription",
          size: new Blob([text]).size,
          path: filePath,
          content: text // Stocker directement le contenu dans la colonne content
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
      toast({ title: "Transcription enregistrée avec succès" });
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
  };

  const handleTranscriptionStart = () => {
    setIsTranscribing(true);
    setError(null);
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

    saveTranscriptionMutation.mutate({ 
      text: transcript, 
      folderId: selectedFolderId 
    });
  };

  const handleReset = () => {
    setTranscript("");
    setAudioURL(null);
    setSelectedFolderId("");
    setError(null);
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
      <DialogContent className="sm:max-w-md">
        {!transcript ? (
          <>
            <h3 className="text-xl font-bold mb-4">Enregistrer une observation</h3>
            <VoiceRecorder 
              onTranscriptionComplete={handleTranscriptionComplete} 
              onTranscriptionStart={handleTranscriptionStart}
              youngProfile={youngProfile} // Pass youngProfile to VoiceRecorder
            />
          </>
        ) : (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Transcription</h3>
            <p className="text-sm text-muted-foreground">{currentDate}</p>
            
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Card className="neumorphic">
              <CardContent className="pt-6">
                <Textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="min-h-[150px] bg-transparent border-0 focus-visible:ring-0 p-0 resize-none"
                  placeholder="Votre transcription apparaîtra ici..."
                />
              </CardContent>
            </Card>
            
            {audioURL && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Écouter l'enregistrement</p>
                <audio controls src={audioURL} className="w-full" />
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Sélectionner un dossier</label>
              <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un dossier" />
                </SelectTrigger>
                <SelectContent>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
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
              >
                {saveTranscriptionMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Valider et classer"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
