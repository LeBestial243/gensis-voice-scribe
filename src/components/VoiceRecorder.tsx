
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, AlertTriangle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string, audioUrl: string | null, hasError?: boolean, errorMessage?: string | null, inconsistencies?: string[]) => void;
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
  const [inconsistencies, setInconsistencies] = useState<string[]>([]);
  
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
          
          if (error) {
            throw error;
          }
          
          if (data.error) {
            throw new Error(data.error);
          }
          
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
    <div className="flex flex-col items-center space-y-4 w-full max-w-md mx-auto">
      {error && (
        <Alert variant="destructive" className="w-full">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {inconsistencies.length > 0 && (
        <Alert variant="default" className="w-full border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertTitle>Incohérences potentielles</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4 mt-2 text-sm">
              {inconsistencies.map((inconsistency, index) => (
                <li key={index}>{inconsistency}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
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
          aria-label={isRecording ? "Arrêter l'enregistrement" : "Démarrer l'enregistrement"}
        >
          {isRecording ? (
            <Square className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </Button>
      </div>
      
      {isRecording && (
        <div className="text-lg font-mono animate-pulse text-red-500">
          {formatTime(recordingTime)}
        </div>
      )}
      
      {isProcessing && (
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
          <p className="text-sm text-muted-foreground">Transcription et analyse en cours...</p>
        </div>
      )}
      
      <div className="text-center text-sm text-muted-foreground">
        {isRecording ? (
          <strong className="text-red-500">Appuyez sur le bouton pour terminer l'enregistrement</strong>
        ) : isProcessing ? (
          "Veuillez patienter pendant le traitement..."
        ) : (
          "Appuyez sur le bouton pour démarrer l'enregistrement"
        )}
      </div>
      
      {isRecording && (
        <Button 
          onClick={stopRecording} 
          variant="destructive"
          className="mt-2"
          type="button"
        >
          <Square className="mr-2 h-4 w-4" />
          Arrêter l'enregistrement
        </Button>
      )}
    </div>
  );
}
