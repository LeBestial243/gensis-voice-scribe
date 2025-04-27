
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface TranscriptionHookProps {
  onTranscriptionComplete: (text: string, audioUrl: string | null, hasError?: boolean, errorMessage?: string | null, inconsistencies?: string[]) => void;
  onTranscriptionStart: () => void;
  youngProfile?: any;
}

export const useTranscriptionProcessing = ({
  onTranscriptionComplete,
  onTranscriptionStart,
  youngProfile
}: TranscriptionHookProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inconsistencies, setInconsistencies] = useState<string[]>([]);
  
  const { toast } = useToast();
  
  const handleTranscriptionError = (error: any) => {
    setIsProcessing(false);
    setError('Erreur lors du traitement de l\'enregistrement.');
    
    onTranscriptionComplete(
      "", 
      null, 
      true, 
      error instanceof Error ? error.message : "Erreur inconnue",
      ["Erreur technique lors du traitement"]
    );
    
    toast({
      title: "Erreur de transcription",
      description: error instanceof Error ? error.message : "Une erreur est survenue lors de la transcription",
      variant: "destructive",
    });
  };
  
  const processRecording = async (audioBlob: Blob, audioUrl: string) => {
    try {
      setIsProcessing(true);
      onTranscriptionStart();
      setError(null);
      setInconsistencies([]);
      
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        if (!base64Audio) {
          throw new Error("Failed to convert audio to base64");
        }
        
        try {
          const { data, error } = await supabase.functions.invoke('transcribe-audio', {
            body: { 
              audio: base64Audio,
              youngProfile: youngProfile
            }
          });
          
          if (error) {
            throw error;
          }
          
          if (data.error) {
            throw new Error(data.error);
          }
          
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
  
  return {
    isProcessing,
    error,
    inconsistencies,
    processRecording
  };
};
