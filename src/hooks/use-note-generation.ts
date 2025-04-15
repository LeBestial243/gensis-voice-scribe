
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UseNoteGenerationProps {
  profileId: string;
  onSuccess?: () => void;
}

// Extended File interface to include content
interface FileWithContent extends File {
  content?: string;
}

export function useNoteGeneration({ profileId, onSuccess }: UseNoteGenerationProps) {
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

  // Save note mutation
  const saveNote = useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      const { data, error } = await supabase
        .from('notes')
        .insert([{ 
          title, 
          content,
          user_id: profileId,
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
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la note: " + (error as Error).message,
        variant: "destructive"
      });
    }
  });

  // Fetch selected files with content
  const { data: selectedFilesData = [] } = useQuery<FileWithContent[]>({
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
      const filesWithContent: FileWithContent[] = [];
      
      for (const file of filesData) {
        try {
          const { data: fileContent, error: downloadError } = await supabase
            .storage
            .from('files')
            .download(file.path);
          
          if (downloadError) {
            console.error('Error downloading file:', downloadError);
            filesWithContent.push({ ...file, content: '' });
            continue;
          }

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

      const transcriptionContents = selectedFilesData
        .filter(file => file.content)
        .map(file => `--- ${file.name} ---\n${file.content || ''}`)
        .join('\n\n');

      const { data, error } = await supabase.functions.invoke('generate-note', {
        body: {
          transcriptions: transcriptionContents,
          templateSections,
          profileData: profile
        }
      });

      if (error) throw error;

      setGeneratedContent(data.content);
      return "result";
    } catch (error) {
      toast({
        title: "Erreur de génération",
        description: "Une erreur est survenue lors de la génération de la note",
        variant: "destructive"
      });
      console.error('Generation error:', error);
      return undefined;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setSelectedTemplateId("");
    setSelectedFiles([]);
    setGeneratedContent("");
    setNoteTitle("Note IA - " + format(new Date(), "PPP", { locale: fr }));
  };

  return {
    selectedTemplateId,
    setSelectedTemplateId,
    selectedFiles,
    setSelectedFiles,
    generatedContent,
    setGeneratedContent,
    noteTitle,
    setNoteTitle,
    isGenerating,
    handleGenerate,
    handleReset,
    saveNote,
  };
}
