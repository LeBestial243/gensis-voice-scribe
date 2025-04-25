
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const currentDate = format(new Date(), "PPP 'à' HH:mm", { locale: fr });

  const saveTranscriptionMutation = useMutation({
    mutationFn: async ({ text, folderId }: { text: string; folderId: string }) => {
      // Create file record in database
      const { data, error } = await supabase
        .from('files')
        .insert({
          folder_id: folderId,
          name: `Transcription du ${format(new Date(), "dd-MM-yyyy-HH-mm")}`,
          type: "text/plain",
          size: new Blob([text]).size,
          path: `transcriptions/${folderId}/${Date.now()}.txt`,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', selectedFolderId] });
      toast({ title: "Transcription enregistrée avec succès" });
      handleReset();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Save error:', error);
      toast({
        title: "Erreur lors de l'enregistrement de la transcription",
        variant: "destructive",
      });
    },
  });

  const handleTranscriptionComplete = (text: string, audioUrl: string | null) => {
    setTranscript(text);
    setAudioURL(audioUrl);
    setIsTranscribing(false);
  };

  const handleSaveTranscription = () => {
    if (!transcript.trim()) {
      toast({
        title: "La transcription est vide",
        description: "Veuillez enregistrer un message ou saisir du texte",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFolderId) {
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
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Only reset if closing and not during active transcription
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
              onTranscriptionStart={() => setIsTranscribing(true)}
            />
          </>
        ) : (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Transcription</h3>
            <p className="text-sm text-muted-foreground">{currentDate}</p>
            
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
              <audio controls src={audioURL} className="w-full" />
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
                {saveTranscriptionMutation.isPending ? "Enregistrement..." : "Valider et classer"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
