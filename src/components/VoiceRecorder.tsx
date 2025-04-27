
import { Button } from "@/components/ui/button";
import { Mic, Square } from "lucide-react";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { RecordingStatus } from "@/components/recording/RecordingStatus";
import { InconsistenciesAlert } from "@/components/recording/InconsistenciesAlert";
import { supabase } from "@/integrations/supabase/client";

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
    isProcessing,
    error,
    inconsistencies,
    startRecording,
    stopRecording
  } = useVoiceRecorder({
    onTranscriptionComplete,
    onTranscriptionStart,
    youngProfile
  });
  
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
      <RecordingStatus 
        isRecording={isRecording}
        recordingTime={recordingTime}
        isProcessing={isProcessing}
        error={error}
      />
      
      <InconsistenciesAlert inconsistencies={inconsistencies} />
      
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
      
      <div className="text-center text-sm text-muted-foreground">
        {isRecording ? (
          <strong className="text-red-500">
            Appuyez sur le bouton pour terminer l'enregistrement
          </strong>
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
