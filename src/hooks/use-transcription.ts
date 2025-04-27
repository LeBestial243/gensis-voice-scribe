
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { checkTranscriptionError } from "@/utils/transcription-utils";

interface UseTranscriptionProps {
  onClose: () => void;
}

export function useTranscription({ onClose }: UseTranscriptionProps) {
  const [transcript, setTranscript] = useState<string>("");
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTranscriptionError, setHasTranscriptionError] = useState<boolean>(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check for transcription errors when text changes
  useEffect(() => {
    if (transcript) {
      setHasTranscriptionError(checkTranscriptionError(transcript));
    } else {
      setHasTranscriptionError(false);
    }
  }, [transcript]);

  const saveTranscriptionMutation = useMutation({
    mutationFn: async ({ text, folderId, hasError }: { text: string; folderId: string; hasError: boolean }) => {
      const fileName = `Transcription du ${format(new Date(), "dd-MM-yyyy-HH-mm")}${hasError ? ' (À VÉRIFIER)' : ''}`;
      const filePath = `transcriptions/${folderId}/${Date.now()}.txt`;
      
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

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', selectedFolderId] });
      queryClient.invalidateQueries({ queryKey: ['folders_file_count'] }); 
      
      toast({ 
        title: hasTranscriptionError 
          ? "Transcription sauvegardée avec indicateur d'erreur. Veuillez vérifier et corriger si nécessaire."
          : "Transcription enregistrée avec succès",
        variant: hasTranscriptionError ? "destructive" : "default"
      });
      handleReset();
      onClose();
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de l'enregistrement.";
      setError(errorMessage);
      toast({
        title: "Erreur lors de l'enregistrement",
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
    setHasTranscriptionError(false);
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

    if (hasTranscriptionError) {
      if (!confirm("Cette transcription semble contenir des erreurs ou des incohérences. Voulez-vous quand même la sauvegarder ?")) {
        return;
      }
    }

    saveTranscriptionMutation.mutate({ 
      text: transcript, 
      folderId: selectedFolderId,
      hasError: hasTranscriptionError
    });
  };

  const handleReset = () => {
    setTranscript("");
    setAudioURL(null);
    setSelectedFolderId("");
    setError(null);
    setHasTranscriptionError(false);
  };

  return {
    transcript,
    setTranscript,
    audioURL,
    selectedFolderId,
    setSelectedFolderId,
    isTranscribing,
    error,
    hasTranscriptionError,
    isPending: saveTranscriptionMutation.isPending,
    handleTranscriptionComplete,
    handleTranscriptionStart,
    handleSaveTranscription,
    handleReset,
  };
}
