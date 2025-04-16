import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string, audioURL: string | null) => void;
  onTranscriptionStart: () => void;
}

export function VoiceRecorder({ onTranscriptionComplete, onTranscriptionStart }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [isRecording, audioURL]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        setIsRecording(false);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Permission refusée",
        description: "Veuillez autoriser l'accès au microphone pour enregistrer.",
        variant: "destructive",
      });
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const processRecording = async () => {
    if (!audioURL) return;
    
    try {
      setIsProcessing(true);
      onTranscriptionStart();

      const response = await fetch(audioURL);
      const blob = await response.blob();
      const reader = new FileReader();
      
      const base64Promise = new Promise((resolve) => {
        reader.onloadend = () => {
          const base64data = reader.result as string;
          const base64Audio = base64data.split(',')[1];
          resolve(base64Audio);
        };
      });
      
      reader.readAsDataURL(blob);
      const base64Audio = await base64Promise;

      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audio: base64Audio }
      });

      if (error) {
        throw error;
      }

      setTranscriptionText(data.text);
      setIsProcessing(false);
      onTranscriptionComplete(data.text, audioURL);
      
      toast({
        title: "Transcription terminée",
        description: "Votre enregistrement a été transcrit avec succès.",
      });
    } catch (error) {
      console.error('Error processing recording:', error);
      setIsProcessing(false);
      toast({
        title: "Erreur de transcription",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la transcription",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-24 h-24 flex items-center justify-center">
            {isRecording ? (
              <div className="absolute inset-0 bg-red-100 dark:bg-red-900 rounded-full animate-pulse"></div>
            ) : null}
            <div 
              className={`
                w-20 h-20 rounded-full flex items-center justify-center
                ${isRecording 
                  ? 'bg-red-500 text-white' 
                  : 'bg-secondary border-2 border-primary text-primary'}
              `}
            >
              {isRecording ? (
                <Square className="h-8 w-8" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </div>
          </div>
          
          {isRecording && (
            <div className="text-lg font-semibold">
              {formatTime(recordingTime)}
            </div>
          )}
          
          {audioURL && !isRecording && (
            <audio controls src={audioURL} className="w-full mt-2" />
          )}
          
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            {!isRecording && !audioURL && (
              <Button 
                onClick={startRecording} 
                className="w-full"
              >
                Commencer l'enregistrement
              </Button>
            )}
            
            {isRecording && (
              <Button 
                onClick={stopRecording} 
                variant="destructive"
                className="w-full"
              >
                Arrêter l'enregistrement
              </Button>
            )}
            
            {audioURL && !isProcessing && (
              <>
                <Button 
                  onClick={startRecording} 
                  variant="outline"
                  className="w-full"
                >
                  Nouvel enregistrement
                </Button>
                <Button 
                  onClick={processRecording} 
                  className="w-full"
                >
                  Transcrire
                </Button>
              </>
            )}
            
            {isProcessing && (
              <Button disabled className="w-full">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement en cours...
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
