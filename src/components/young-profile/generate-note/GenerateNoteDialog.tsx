
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplateSelector } from "./TemplateSelector";
import { FileSelector } from "./FileSelector";
import { ResultEditor } from "./ResultEditor";

interface File {
  id: string;
  name: string;
  type: string;
  created_at: string;
  updated_at: string;
  path: string;
  content?: string;
}

interface GenerateNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
}

export function GenerateNoteDialog({
  open,
  onOpenChange,
  profileId,
}: GenerateNoteDialogProps) {
  const [activeStep, setActiveStep] = useState("template");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [generatedContent, setGeneratedContent] = useState("");
  const [noteTitle, setNoteTitle] = useState("Note IA - " + format(new Date(), "PPP", { locale: fr }));
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch profile data
  const { data: profile } = useQuery({
    queryKey: ['young_profile', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('young_profiles')
        .select('*')
        .eq('id', profileId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch selected files with content
  const { data: selectedFilesData = [] } = useQuery<File[]>({
    queryKey: ['selected_files_content', selectedFiles],
    queryFn: async () => {
      if (selectedFiles.length === 0) return [];

      const { data: filesData, error } = await supabase
        .from('files')
        .select(`
          id,
          name,
          type,
          created_at,
          updated_at,
          path
        `)
        .in('id', selectedFiles);
      
      if (error) throw error;
      if (!filesData) return [];

      // For each file, try to get its content
      const filesWithContent: File[] = [];
      
      for (const file of filesData) {
        try {
          // Attempt to download the file content
          const { data: fileContent, error: downloadError } = await supabase
            .storage
            .from('files')
            .download(file.path);
          
          if (downloadError) {
            console.error('Error downloading file:', downloadError);
            filesWithContent.push({ ...file, content: '' });
            continue;
          }

          // Convert blob to text
          const content = await fileContent.text();
          filesWithContent.push({ ...file, content });
        } catch (error) {
          console.error('Error processing file content:', error);
          filesWithContent.push({ ...file, content: '' });
        }
      }
      
      return filesWithContent;
    },
    enabled: selectedFiles.length > 0,
  });

  // Save note mutation
  const saveNote = useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      const { data, error } = await supabase
        .from('notes')
        .insert([{ 
          title, 
          content,
          user_id: profile?.user_id,
          template_id: selectedTemplateId || null
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast({
        title: "Note sauvegardée",
        description: "La note IA a été sauvegardée avec succès"
      });
      handleReset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la note: " + (error as Error).message,
        variant: "destructive"
      });
    }
  });

  const handleGenerate = async () => {
    if (!selectedTemplateId || selectedFiles.length === 0 || !profile) {
      toast({
        title: "Données manquantes",
        description: "Veuillez sélectionner un template et au moins un fichier",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data: templateSections } = await supabase
        .from('template_sections')
        .select('*')
        .eq('template_id', selectedTemplateId)
        .order('order_index');

      // Get the transcription contents from selectedFilesData
      const transcriptionContents = selectedFilesData
        .filter(file => file.content)
        .map(file => `--- ${file.name} ---\n${file.content || ''}`)
        .join('\n\n');

      // Call our edge function
      const { data, error } = await supabase.functions.invoke('generate-note', {
        body: {
          transcriptions: transcriptionContents,
          templateSections,
          profileData: profile
        }
      });

      if (error) throw error;

      setGeneratedContent(data.content);
      setActiveStep("result");

    } catch (error) {
      toast({
        title: "Erreur de génération",
        description: "Une erreur est survenue lors de la génération de la note",
        variant: "destructive"
      });
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileSelect = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId) 
        : [...prev, fileId]
    );
  };

  const handleReset = () => {
    setSelectedTemplateId("");
    setSelectedFiles([]);
    setGeneratedContent("");
    setActiveStep("template");
    setNoteTitle("Note IA - " + format(new Date(), "PPP", { locale: fr }));
  };

  const handleSave = () => {
    if (!generatedContent) {
      toast({
        title: "Contenu manquant",
        description: "Veuillez d'abord générer une note",
        variant: "destructive"
      });
      return;
    }
    
    saveNote.mutate({ 
      title: noteTitle, 
      content: generatedContent 
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent)
      .then(() => {
        toast({
          title: "Copié !",
          description: "Le contenu a été copié dans le presse-papier"
        });
      })
      .catch(() => {
        toast({
          title: "Erreur",
          description: "Impossible de copier le contenu",
          variant: "destructive"
        });
      });
  };

  const handleExport = () => {
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${noteTitle.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exporté !",
      description: "La note a été exportée en fichier texte"
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Générer une note IA</DialogTitle>
          <DialogDescription>
            Utilisez l'IA pour générer une synthèse à partir des informations du dossier.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeStep} onValueChange={setActiveStep} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="template">1. Template</TabsTrigger>
            <TabsTrigger value="files">2. Fichiers</TabsTrigger>
            <TabsTrigger value="result" disabled={!generatedContent}>3. Résultat</TabsTrigger>
          </TabsList>

          <TabsContent value="template">
            <TemplateSelector
              selectedTemplateId={selectedTemplateId}
              onTemplateSelect={setSelectedTemplateId}
            />
            <div className="flex justify-end mt-4">
              <Button
                onClick={() => setActiveStep("files")}
                disabled={!selectedTemplateId}
              >
                Suivant
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="files">
            <FileSelector
              profileId={profileId}
              selectedFiles={selectedFiles}
              onFileSelect={handleFileSelect}
            />
            <div className="flex justify-between mt-4">
              <Button
                variant="outline"
                onClick={() => setActiveStep("template")}
              >
                Retour
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || selectedFiles.length === 0}
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Génération en cours...
                  </>
                ) : (
                  "Générer la note"
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="result">
            <ResultEditor
              noteTitle={noteTitle}
              onTitleChange={setNoteTitle}
              generatedContent={generatedContent}
              onContentChange={setGeneratedContent}
              onSave={handleSave}
              onCopy={handleCopy}
              onExport={handleExport}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
