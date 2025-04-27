
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

export function useAudioRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
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
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
      
      console.log('Recording started successfully');
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
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

  const getRecordedAudioBlob = (): Blob => {
    return new Blob(audioChunksRef.current, { type: 'audio/webm' });
  };

  return {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    getRecordedAudioBlob
  };
}
