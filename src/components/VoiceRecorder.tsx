
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
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const { toast } = useToast();

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toISOString()}: ${info}`]);
    console.log(`[DEBUG] ${info}`);
  };

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
      addDebugInfo("Vérification des permissions du microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermission(true);
      setError(null);
      addDebugInfo("Permission du microphone accordée");
      return true;
    } catch (err) {
      addDebugInfo(`Erreur permission microphone: ${err instanceof Error ? err.message : 'erreur inconnue'}`);
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
    setDebugInfo([]);
    
    const hasPermission = await checkMicrophonePermission();
    if (!hasPermission) return;
    
    try {
      addDebugInfo("Démarrage de l'enregistrement audio...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      addDebugInfo(`Stream audio obtenu: ${stream.id}`);
      
      const options = { mimeType: 'audio/webm' };
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        addDebugInfo(`Données disponibles: ${e.data.size} bytes`);
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        addDebugInfo("MediaRecorder arrêté");
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
        addDebugInfo(`Blob audio créé: ${audioBlob.size} bytes`);
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
        const errorMessage = `Erreur MediaRecorder: ${e instanceof Error ? e.message : 'erreur inconnue'}`;
        addDebugInfo(errorMessage);
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
      addDebugInfo("MediaRecorder démarré");
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
      const errorMessage = `Erreur démarrage enregistrement: ${error instanceof Error ? error.message : 'erreur inconnue'}`;
      addDebugInfo(errorMessage);
      setError(errorMessage);
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
        addDebugInfo("Arrêt de l'enregistrement...");
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => {
          addDebugInfo(`Arrêt du track: ${track.kind}`);
          track.stop();
        });
      } catch (error) {
        const errorMessage = `Erreur arrêt enregistrement: ${error instanceof Error ? error.message : 'erreur inconnue'}`;
        addDebugInfo(errorMessage);
        setError(errorMessage);
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
      addDebugInfo("Récupération du blob audio...");
      const response = await fetch(audioURL);
      const blob = await response.blob();
      addDebugInfo(`Blob récupéré: ${blob.size} bytes, type: ${blob.type}`);
      
      addDebugInfo("Conversion en base64...");
      const reader = new FileReader();
      
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          try {
            const base64data = reader.result as string;
            const base64Audio = base64data.split(',')[1];
            addDebugInfo(`Audio converti en base64, longueur: ${base64Audio.length}`);
            resolve(base64Audio);
          } catch (error) {
            reject(new Error("Erreur lors de la conversion de l'audio en base64"));
          }
        };
        reader.onerror = () => reject(new Error("Erreur lors de la lecture du fichier audio"));
      });
      
      reader.readAsDataURL(blob);
      const base64Audio = await base64Promise;

      addDebugInfo("Appel de l'Edge Function pour la transcription...");
      addDebugInfo(`youngProfile envoyé: ${youngProfile ? JSON.stringify({
        first_name: youngProfile.first_name,
        last_name: youngProfile.last_name,
        birth_date: youngProfile.birth_date
      }) : 'non défini'}`);
      
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { 
          audio: base64Audio,
          youngProfile
        }
      });

      if (error) {
        addDebugInfo(`Erreur Edge Function: ${error.message}`);
        throw error;
      }

      if (data.error) {
        addDebugInfo(`Erreur API transcription: ${data.error}`);
        if (data.code === 'insufficient_quota') {
          throw new Error("Le quota OpenAI est dépassé. Veuillez vérifier le plan et les détails de facturation.");
        } else if (data.code === 'missing_api_key') {
          throw new Error("Clé API OpenAI manquante. Veuillez configurer la clé API dans les paramètres du projet.");
        } else {
          throw new Error(data.error);
        }
      }

      if (!data.text) {
        addDebugInfo("Réponse de transcription vide");
        throw new Error("Réponse de transcription invalide ou texte vide.");
      }

      addDebugInfo(`Transcription réussie, longueur: ${data.text.length}`);
      setIsProcessing(false);
      onTranscriptionComplete(data.text, audioURL);
      
      toast({
        title: "Transcription terminée",
        description: "Votre enregistrement a été transcrit et reformulé avec succès.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue est survenue";
      addDebugInfo(`Erreur traitement: ${errorMessage}`);
      setIsProcessing(false);
      setError(errorMessage);
      
      toast({
        title: "Erreur de transcription",
        description: errorMessage,
        variant: "destructive",
      });
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
          
          {/* Zone de débogage */}
          {debugInfo.length > 0 && (
            <div className="w-full mb-4 p-2 bg-gray-100 rounded text-xs max-h-40 overflow-y-auto">
              <h4 className="font-bold mb-1">Debug Info:</h4>
              {debugInfo.map((info, index) => (
                <div key={index}>{info}</div>
              ))}
            </div>
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
