
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { InconsistencyCheck } from "@/types/inconsistency";

interface TranscriptionCallbacks {
  onTranscriptionStart: () => void;
  onTranscriptionComplete: (
    text: string, 
    audioUrl: string | null, 
    hasError?: boolean, 
    errorMessage?: string | null, 
    inconsistencies?: InconsistencyCheck[]
  ) => void;
  youngProfile?: any;
}

export function useTranscriptionProcessing({
  onTranscriptionStart,
  onTranscriptionComplete,
  youngProfile
}: TranscriptionCallbacks) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inconsistencies, setInconsistencies] = useState<InconsistencyCheck[]>([]);
  const { toast } = useToast();

  const processRecording = async (audioBlob: Blob) => {
    try {
      console.log('🎤 Début du traitement de l\'enregistrement');
      console.log('📏 Taille de l\'audio:', audioBlob.size, 'bytes');
      console.log('📄 Type de l\'audio:', audioBlob.type);
      
      setIsProcessing(true);
      onTranscriptionStart();
      
      // Create audio URL for playback
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        if (!base64Audio) {
          console.error('❌ Échec de la conversion en base64');
          throw new Error("Failed to convert audio to base64");
        }
        
        console.log('✅ Audio converti en base64, longueur:', base64Audio.length);
        
        try {
          console.log('🚀 Appel de la fonction Edge transcribe-audio...');
          console.log('👤 Profil du jeune:', youngProfile);
          
          const { data, error } = await supabase.functions.invoke('transcribe-audio', {
            body: { 
              audio: base64Audio,
              youngProfile: youngProfile
            }
          });
          
          console.log('📥 Réponse de la fonction Edge:', { data, error });
          
          if (error) {
            console.error('❌ Erreur de la fonction Edge:', error);
            throw error;
          }
          
          if (data.error) {
            console.error('❌ Erreur retournée par la fonction:', data.error);
            throw new Error(data.error);
          }
          
          console.log("✅ Transcription reçue:", data);
          
          // Check for errors and inconsistencies
          const hasError = data.hasError === true;
          const errorMessage = data.errorMessage || null;
          const detectedInconsistencies = data.inconsistencies || [];
          
          setInconsistencies(detectedInconsistencies);
          
          onTranscriptionComplete(
            data.text, 
            audioUrl, 
            hasError, 
            errorMessage, 
            detectedInconsistencies
          );
          
          setIsProcessing(false);
          
          if (hasError) {
            toast({
              title: "Attention",
              description: "La transcription contient possiblement des erreurs ou incohérences.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('❌ Erreur lors de l\'appel à la fonction Edge:', error);
          handleTranscriptionError(error);
        }
      };
      
      reader.onerror = (error) => {
        console.error('❌ Erreur de lecture du fichier:', error);
        handleTranscriptionError(error);
      };
      
    } catch (error) {
      console.error('❌ Erreur générale dans processRecording:', error);
      handleTranscriptionError(error);
    }
  };

  const handleTranscriptionError = (error: any) => {
    console.error('Error processing recording:', error);
    setIsProcessing(false);
    setError('Erreur lors du traitement de l\'enregistrement.');
    
    const errorInconsistency: InconsistencyCheck[] = [{
      type: 'other',
      message: error instanceof Error ? error.message : "Erreur technique lors du traitement",
      severity: 'error'
    }];
    
    setInconsistencies(errorInconsistency);
    
    onTranscriptionComplete(
      "", 
      null, 
      true, 
      error instanceof Error ? error.message : "Erreur inconnue",
      errorInconsistency
    );
    
    toast({
      title: "Erreur de transcription",
      description: error instanceof Error ? error.message : "Une erreur est survenue lors de la transcription",
      variant: "destructive",
    });
  };

  return {
    isProcessing,
    error,
    inconsistencies,
    processRecording
  };
}
