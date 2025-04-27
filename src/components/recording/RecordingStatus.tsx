
import { formatTime } from "@/utils/formatTime";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Loader2 } from "lucide-react";

interface RecordingStatusProps {
  isRecording: boolean;
  recordingTime: number;
  isProcessing: boolean;
  error: string | null;
}

export function RecordingStatus({ 
  isRecording, 
  recordingTime, 
  isProcessing, 
  error 
}: RecordingStatusProps) {
  if (error) {
    return (
      <Alert variant="destructive" className="w-full">
        <AlertTriangle className="h-4 w-4 mr-2" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
        <p className="text-sm text-muted-foreground">
          Transcription et analyse en cours...
        </p>
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="text-lg font-mono animate-pulse text-red-500">
        {formatTime(recordingTime)}
      </div>
    );
  }

  return null;
}
