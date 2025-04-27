
import { useAudioRecording } from './voice-recorder/useAudioRecording';
import { useTranscriptionProcessing } from './voice-recorder/useTranscriptionProcessing';
import type { InconsistencyCheck } from '@/types/inconsistency';

export interface UseVoiceRecorderProps {
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

export function useVoiceRecorder({
  onTranscriptionStart,
  onTranscriptionComplete,
  youngProfile
}: UseVoiceRecorderProps) {
  const {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    getRecordedAudioBlob
  } = useAudioRecording();

  const {
    isProcessing,
    error,
    processRecording
  } = useTranscriptionProcessing({
    onTranscriptionStart,
    onTranscriptionComplete,
    youngProfile
  });

  const handleStopRecording = () => {
    if (isRecording) {
      stopRecording();
      const audioBlob = getRecordedAudioBlob();
      processRecording(audioBlob);
    }
  };

  return {
    isRecording,
    recordingTime,
    isProcessing,
    error,
    startRecording,
    stopRecording: handleStopRecording
  };
}
