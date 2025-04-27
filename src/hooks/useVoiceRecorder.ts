
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { InconsistencyCheck } from "@/types/inconsistency";

export interface UseVoiceRecorderProps {
  onTranscriptionStart: () => void;
  onTranscriptionComplete: (text: string, audioUrl: string | null, hasError?: boolean, errorMessage?: string | null, inconsistencies?: InconsistencyCheck[]) => void;
  youngProfile?: any;
}

export function useVoiceRecorder({
  onTranscriptionStart,
  onTranscriptionComplete,
  youngProfile
}: UseVoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inconsistencies, setInconsistencies] = useState<InconsistencyCheck[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      stopRecording();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      console.log('Starting recording...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setIsRecording(false);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        processRecording(audioBlob, audioUrl);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setError(null);
      setInconsistencies([]);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
      
      console.log('Recording started successfully');
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Impossible d\'accéder au microphone. Veuillez vérifier vos permissions.');
      toast({
        title: "Erreur de microphone",
        description: "Impossible d'accéder au microphone. Veuillez vérifier vos permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    console.log('Stopping recording...', { 
      isRecording, 
      mediaRecorderState: mediaRecorderRef.current?.state 
    });
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
        console.log('MediaRecorder stopped successfully');
      } catch (error) {
        console.error('Error stopping MediaRecorder:', error);
      }
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Audio track stopped');
      });
      streamRef.current = null;
    }

    setIsRecording(false);
  };

  const processRecording = async (audioBlob: Blob, audioUrl: string) => {
    try {
      setIsProcessing(true);
      onTranscriptionStart();
      
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
    
    // Create a properly typed array for error case
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
    isRecording,
    recordingTime,
    isProcessing,
    error,
    inconsistencies,
    startRecording,
    stopRecording
  };
}
