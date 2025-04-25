import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mic, Square, FileText, Loader2 } from "lucide-react";

interface RecordingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
}

export function RecordingDialog({ open, onOpenChange, profileId }: RecordingDialogProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState("");
  const [activeTab, setActiveTab] = useState("recording");
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [fileName, setFileName] = useState("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: folders = [] } = useQuery({
    queryKey: ['folders', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('profile_id', profileId)
        .order('title', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const saveTranscription = useMutation({
    mutationFn: async ({ title, content, folderId }: { title: string, content: string, folderId: string }) => {
      const { data: tableInfo, error: tableError } = await supabase
        .from('files')
        .select('*')
        .limit(1);
        
      if (tableError) {
        console.error('Error checking table structure:', tableError);
        throw tableError;
      }
      
      const fileData = {
        name: title,
        folder_id: folderId,
        type: 'transcription',
        path: '',
        size: content.length
      };
      
      if ('description' in Object.keys(tableInfo?.[0] || {})) {
        Object.assign(fileData, { description: content });
      }
      
      console.log('Inserting file with data:', fileData);
      
      const { data, error } = await supabase
        .from('files')
        .insert(fileData)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['folders_file_count'] });
      
      toast({
        title: "Transcription enregistrée",
        description: "Votre transcription a été enregistrée avec succès."
      });
      
      onOpenChange(false);
      resetRecording();
    },
    onError: (error) => {
      console.error('Error saving transcription:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'enregistrer la transcription.",
        variant: "destructive"
      });
    }
  });

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
      setActiveTab("transcription");
    }
  };

  const processRecording = async () => {
    if (!audioURL) return;
    
    try {
      setIsProcessing(true);

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
      setActiveTab("transcription");
      
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

  const handleSave = () => {
    if (!transcriptionText || !selectedFolderId || !fileName) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs requis.",
        variant: "destructive"
      });
      return;
    }

    saveTranscription.mutate({
      title: fileName,
      content: transcriptionText,
      folderId: selectedFolderId
    });
  };

  const resetRecording = () => {
    setIsRecording(false);
    setRecordingTime(0);
    setAudioURL(null);
    setTranscriptionText("");
    setActiveTab("recording");
    setSelectedFolderId("");
    setFileName("");
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      resetRecording();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Enregistrement vocal</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="recording">Enregistrement</TabsTrigger>
            <TabsTrigger value="transcription">Transcription</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recording" className="py-4">
            <div className="flex flex-col items-center gap-6">
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
              
              <div className="flex gap-2 w-full">
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
                      className="w-1/2"
                    >
                      Nouvel enregistrement
                    </Button>
                    <Button 
                      onClick={processRecording} 
                      className="w-1/2"
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
          </TabsContent>
          
          <TabsContent value="transcription" className="py-4 space-y-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="fileName" className="block text-sm font-medium mb-1">
                  Nom du fichier <span className="text-red-500">*</span>
                </label>
                <Input
                  id="fileName"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Entrez un nom pour le fichier"
                />
              </div>
              
              <div>
                <label htmlFor="folder" className="block text-sm font-medium mb-1">
                  Dossier <span className="text-red-500">*</span>
                </label>
                <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un dossier" />
                  </SelectTrigger>
                  <SelectContent>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label htmlFor="transcription" className="block text-sm font-medium mb-1">
                  Transcription <span className="text-red-500">*</span>
                </label>
                <Textarea
                  id="transcription"
                  value={transcriptionText}
                  onChange={(e) => setTranscriptionText(e.target.value)}
                  placeholder="Le texte transcrit apparaîtra ici"
                  className="min-h-[150px]"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setActiveTab("recording")} className="w-1/2">
                  Retour
                </Button>
                <Button onClick={handleSave} className="w-1/2" disabled={saveTranscription.isPending}>
                  {saveTranscription.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
