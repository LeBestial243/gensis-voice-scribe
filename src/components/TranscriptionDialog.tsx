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
}

export function TranscriptionDialog({ 
  open, 
  onOpenChange, 
  profileId, 
  folders 
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
      
      const { data: tableInfo, error: tableError } = await supabase
        .from('files')
        .select('*')
        .limit(1);
        
      if (tableError) {
        console.error('Error checking table structure:', tableError);
        throw tableError;
      }
      
      const fileData = {
        folder_id: folderId,
        name: `Transcription du ${format(new Date(), "dd-MM-yyyy-HH-mm")}`,
        type: "transcription",
        size: new Blob([text]).size,
        path: `transcriptions/${folderId}/${Date.now()}.txt`,
      };
      
      if ('description' in Object.keys(tableInfo?.[0] || {})) {
        Object.assign(fileData, { description: text });
      }
      
      console.log('Inserting file with data:', fileData);
      
      const { data, error } = await supabase
        .from('files')
        .insert(fileData)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      if (data && !('description' in Object.keys(tableInfo?.[0] || {}))) {
        console.log('Warning: Description column not found, text content may not be saved properly');
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
