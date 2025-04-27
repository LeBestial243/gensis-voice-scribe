
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
      console.log('🎙️ Demande de permission microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      console.log('✅ Permission accordée, création du MediaRecorder...');
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        console.log('📼 Données audio reçues:', e.data.size, 'bytes');
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.start();
      console.log('⏺️ Enregistrement démarré');
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Erreur dans startRecording:', error);
      toast({
        title: "Erreur de microphone",
        description: "Impossible d'accéder au microphone. Veuillez vérifier vos permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    console.log('⏹️ Tentative d\'arrêt de l\'enregistrement...', { 
      isRecording, 
      mediaRecorderState: mediaRecorderRef.current?.state 
    });
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
        console.log('✅ MediaRecorder arrêté avec succès');
      } catch (error) {
        console.error('❌ Erreur arrêt MediaRecorder:', error);
      }
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('✅ Piste audio arrêtée');
      });
      streamRef.current = null;
    }

    setIsRecording(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const getRecordedAudioBlob = (): Blob => {
    console.log('💾 Création du blob audio...', audioChunksRef.current.length, 'chunks');
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
