import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string, audioURL: string | null) => void;
  onTranscriptionStart: () => void;
  youngProfile?: any;
}

export function VoiceRecorder({ onTranscriptionComplete, onTranscriptionStart, youngProfile }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [micPermission, setMicPermission] = useState<boolean | null>(null);
  
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

  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermission(true);
      setError(null);
      return true;
    } catch (err) {
      console.error("Microphone permission error:", err);
      setMicPermission(false);
      setError("Accès au microphone refusé. Veuillez autoriser l'accès dans les paramètres de votre navigateur.");
      toast({
        title: "Permission refusée",
        description: "Accès au microphone refusé. Veuillez vérifier les paramètres de votre navigateur.",
        variant: "destructive",
      });
      return false;
    }
  };

  const startRecording = async () => {
    setError(null);
    
    const hasPermission = await checkMicrophonePermission();
    if (!hasPermission) return;
    
    try {
      console.log("Starting audio recording...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log("Audio stream obtained:", stream.id);
      
      const options = { mimeType: 'audio/webm' };
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        console.log("Data available: chunk size:", e.data.size);
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log("MediaRecorder stopped");
        if (audioChunksRef.current.length === 0) {
          setError("Aucun son n'a été enregistré. Veuillez vérifier votre microphone.");
          toast({
            title: "Enregistrement vide",
            description: "Aucun son n'a été enregistré. Veuillez vérifier votre microphone.",
            variant: "destructive",
          });
          return;
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log("Audio blob created:", audioBlob.size, "bytes");
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        setIsRecording(false);
        
        toast({
          title: "Enregistrement terminé",
          description: "Vous pouvez maintenant écouter ou transcrire votre enregistrement.",
        });
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
      
      mediaRecorder.addEventListener('error', (e) => {
        console.error("MediaRecorder error:", e);
        const errorMessage = "Erreur avec l'enregistreur: " + (e instanceof Error ? e.message : "erreur inconnue");
        setError(errorMessage);
        setIsRecording(false);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        toast({
          title: "Erreur d'enregistrement",
          description: errorMessage,
          variant: "destructive",
        });
      });
      
      mediaRecorder.start(1000);
      console.log("MediaRecorder started");
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
      
      toast({
        title: "Enregistrement en cours",
        description: "Parlez clairement dans votre microphone.",
      });
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setError("Erreur lors du démarrage de l'enregistrement: " + (error instanceof Error ? error.message : "erreur inconnue"));
      toast({
        title: "Erreur d'enregistrement",
        description: "Impossible de démarrer l'enregistrement. Veuillez vérifier votre microphone.",
        variant: "destructive",
      });
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        console.log("Stopping MediaRecorder...");
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => {
          console.log("Stopping track:", track.kind);
          track.stop();
        });
      } catch (error) {
        console.error('Error stopping recording:', error);
        setError("Erreur lors de l'arrêt de l'enregistrement: " + (error instanceof Error ? error.message : "erreur inconnue"));
        toast({
          title: "Erreur",
          description: "Impossible d'arrêter l'enregistrement correctement.",
          variant: "destructive",
        });
      }
    }
  };

  const processRecording = async () => {
    if (!audioURL) {
      setError("Aucun enregistrement audio à traiter.");
      toast({
        title: "Erreur",
        description: "Aucun enregistrement audio à traiter.",
        variant: "destructive",
      });
      return;
    }
    
    setError(null);
    setIsProcessing(true);
    onTranscriptionStart();

    try {
      const response = await fetch(audioURL);
      const blob = await response.blob();
      const reader = new FileReader();
      
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          try {
            const base64data = reader.result as string;
            const base64Audio = base64data.split(',')[1];
            resolve(base64Audio);
          } catch (error) {
            reject(new Error("Erreur lors de la conversion de l'audio en base64"));
          }
        };
        reader.onerror = () => reject(new Error("Erreur lors de la lecture du fichier audio"));
      });
      
      const base64Audio = await base64Promise;

      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { 
          audio: base64Audio,
          youngProfile
        }
      });

      if (error) throw error;

      if (data.error) {
        if (data.code === 'insufficient_quota') {
          throw new Error("Le quota OpenAI est dépassé. Veuillez vérifier le plan et les détails de facturation.");
        } else if (data.code === 'missing_api_key') {
          throw new Error("Clé API OpenAI manquante. Veuillez configurer la clé API dans les paramètres du projet.");
        } else {
          throw new Error(data.error);
        }
      }

      if (!data.text) {
        throw new Error("Réponse de transcription invalide ou texte vide.");
      }

      setIsProcessing(false);
      onTranscriptionComplete(data.text, audioURL);
      
      toast({
        title: "Transcription terminée",
        description: "Votre enregistrement a été transcrit et reformulé avec succès.",
      });
    } catch (error) {
      console.error('Error processing recording:', error);
      setIsProcessing(false);
      setError(error instanceof Error ? error.message : "Une erreur inconnue est survenue");
      
      toast({
        title: "Erreur de transcription",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la transcription",
        variant: "destructive",
      });
      
      onTranscriptionComplete("", audioURL);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center gap-4">
          {error && (
            <Alert variant="destructive" className="mb-4 w-full">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
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
            <div className="text-lg font-semibold animate-pulse">
              Enregistrement en cours... {formatTime(recordingTime)}
            </div>
          )}
          
          {audioURL && !isRecording && (
            <>
              <div className="text-sm text-muted-foreground mb-1">Écoutez votre enregistrement</div>
              <audio 
                controls 
                src={audioURL} 
                className="w-full mt-2"
                onError={() => {
                  console.error("Audio playback error");
                  setError("Impossible de lire l'enregistrement audio.");
                  URL.revokeObjectURL(audioURL);
                  setAudioURL(null);
                }}
              />
            </>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            {!isRecording && !audioURL && (
              <Button 
                onClick={startRecording} 
                className="w-full"
                disabled={micPermission === false}
              >
                <Mic className="mr-2 h-4 w-4" />
                Commencer l'enregistrement
              </Button>
            )}
            
            {isRecording && (
              <Button 
                onClick={stopRecording} 
                variant="destructive"
                className="w-full"
              >
                <Square className="mr-2 h-4 w-4" />
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
          
          {micPermission === false && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <AlertDescription>
                Pour utiliser cette fonction, veuillez autoriser l'accès au microphone dans les paramètres de votre navigateur.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
