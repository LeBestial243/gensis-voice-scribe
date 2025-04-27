
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
  const { toast } = useToast();

  const processRecording = async (audioBlob: Blob) => {
    try {
      setIsProcessing(true);
      onTranscriptionStart();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        if (!base64Audio) {
          throw new Error("Failed to convert audio to base64");
        }
        
        try {
          console.log('Sending audio to transcribe function with profile data...');
          const { data, error } = await supabase.functions.invoke('transcribe-audio', {
            body: { 
              audio: base64Audio,
              youngProfile: youngProfile
            }
          });
          
          if (error) throw error;
          if (data.error) throw new Error(data.error);
          
          console.log("Transcription received:", data);
          
          const hasError = data.hasError === true;
          const errorMessage = data.errorMessage || null;
          const detectedInconsistencies = data.inconsistencies || [];
          
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
              description: "La transcription contient des incohérences potentielles.",
              variant: "destructive",
            });
          }
        } catch (error) {
          handleTranscriptionError(error);
        }
      };
      
      reader.onerror = (error) => {
        handleTranscriptionError(error);
      };
      
    } catch (error) {
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
    processRecording
  };
}
