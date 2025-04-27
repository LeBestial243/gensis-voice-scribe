
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string, audioUrl: string | null, hasError?: boolean, errorMessage?: string | null) => void;
  onTranscriptionStart: () => void;
  youngProfile?: any;
}

export function VoiceRecorder({ 
  onTranscriptionComplete, 
  onTranscriptionStart,
  youngProfile 
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
    
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.error('Error stopping MediaRecorder:', error);
      }
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };
  
  const processRecording = async (audioBlob: Blob, audioUrl: string) => {
    try {
      setIsProcessing(true);
      onTranscriptionStart();
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        if (!base64Audio) {
          throw new Error("Failed to convert audio to base64");
        }
        
        try {
          console.log('Sending audio to transcribe function...');
          // Call the Edge Function
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
          
          console.log("Transcription received:", data);
          
          // Check for errors
          const hasError = data.hasError === true;
          const errorMessage = data.errorMessage || null;
          
          onTranscriptionComplete(data.text, audioUrl, hasError, errorMessage);
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
  
  const handleTranscriptionError = (error: any) => {
    console.error('Error processing recording:', error);
    setIsProcessing(false);
    setError('Erreur lors du traitement de l\'enregistrement.');
    
    onTranscriptionComplete("", null);
    
    toast({
      title: "Erreur de transcription",
      description: error instanceof Error ? error.message : "Une erreur est survenue lors de la transcription",
      variant: "destructive",
    });
  };
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  const handleRecordButtonClick = () => {
    console.log('Record button clicked, current state:', { isRecording });
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  return (
    <div className="flex flex-col items-center space-y-4">
      {error && (
        <div className="text-red-500 text-center mb-4 w-full">
          {error}
        </div>
      )}
      
      <div className="relative w-20 h-20">
        {isRecording && (
          <div className="absolute inset-0 rounded-full bg-red-100 dark:bg-red-900 animate-ping opacity-75"></div>
        )}
        <Button
          variant={isRecording ? "destructive" : "outline"}
          size="icon"
          className={`w-20 h-20 rounded-full ${isRecording ? 'bg-red-500 hover:bg-red-600' : ''}`}
          onClick={handleRecordButtonClick}
          disabled={isProcessing}
          type="button"
        >
          {isRecording ? (
            <Square className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </Button>
      </div>
      
      {isRecording && (
        <div className="text-lg font-mono">
          {formatTime(recordingTime)}
        </div>
      )}
      
      {isProcessing && (
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
          <p className="text-sm text-muted-foreground">Transcription en cours...</p>
        </div>
      )}
      
      <div className="text-center text-sm text-muted-foreground">
        {isRecording ? (
          "Appuyez sur le bouton pour terminer l'enregistrement"
        ) : isProcessing ? (
          "Veuillez patienter pendant le traitement..."
        ) : (
          "Appuyez sur le bouton pour démarrer l'enregistrement"
        )}
      </div>
    </div>
  );
}
