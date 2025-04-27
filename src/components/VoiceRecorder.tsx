
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { useTranscriptionProcessing } from "@/hooks/useTranscriptionProcessing";
import { AlertMessage } from "./voice-recorder/AlertMessage";

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
  const {
    isRecording,
    recordingTime,
    error: recordingError,
    audioChunksRef,
    startRecording,
    stopRecording
  } = useAudioRecording();

  const {
    isProcessing,
    error: processingError,
    inconsistencies,
    processRecording
  } = useTranscriptionProcessing({
    onTranscriptionComplete,
    onTranscriptionStart,
    youngProfile
  });

  useEffect(() => {
    if (!isRecording && audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const audioUrl = URL.createObjectURL(audioBlob);
      processRecording(audioBlob, audioUrl);
    }
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  const handleRecordButtonClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  return (
    <div className="flex flex-col items-center space-y-4 w-full max-w-md mx-auto">
      <AlertMessage 
        error={recordingError || processingError}
        inconsistencies={inconsistencies}
      />
      
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
