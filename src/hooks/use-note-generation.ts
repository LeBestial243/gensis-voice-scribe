
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileWithContent } from "@/components/young-profile/generate-note/FileSelector";

interface UseNoteGenerationProps {
  profileId: string;
  onSuccess?: () => void;
}

export function useNoteGeneration({ profileId, onSuccess }: UseNoteGenerationProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [generatedContent, setGeneratedContent] = useState("");
  const [noteTitle, setNoteTitle] = useState("Note IA - " + format(new Date(), "PPP", { locale: fr }));
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch profile data
  const { data: profile, error: profileError } = useQuery({
    queryKey: ['young_profile', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('young_profiles')
        .select('*')
        .eq('id', profileId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        throw new Error(`Erreur de chargement du profil: ${error.message}`);
      }
      return data;
    },
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Save note mutation
  const saveNote = useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      // Reset previous errors
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non authentifié");
      
      const { data, error } = await supabase
        .from('notes')
        .insert([{ 
          title, 
          content,
          user_id: user.id,
          template_id: selectedTemplateId || null
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Error saving note:', error);
        throw new Error(`Erreur lors de la sauvegarde: ${error.message}`);
      }
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
      const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue est survenue";
      setError(errorMessage);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la note: " + errorMessage,
        variant: "destructive"
      });
    }
  });

  // Fetch selected files with content
  const { data: selectedFilesData = [], error: filesError } = useQuery<FileWithContent[]>({
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
          path,
          size
        `)
        .in('id', selectedFiles);
      
      if (error) {
        console.error('Error fetching files data:', error);
        throw new Error(`Erreur de chargement des fichiers: ${error.message}`);
      }
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
            filesWithContent.push({ 
              ...file, 
              content: `[Erreur de chargement: ${downloadError.message}]`
            });
            continue;
          }

          const content = await fileContent.text();
          filesWithContent.push({ ...file, content });
        } catch (error) {
          console.error('Error processing file content:', error);
          const errorMessage = error instanceof Error ? error.message : "erreur inconnue";
          filesWithContent.push({ 
            ...file, 
            content: `[Erreur de traitement: ${errorMessage}]`
          });
        }
      }
      
      return filesWithContent;
    },
    enabled: selectedFiles.length > 0,
    retry: 2,
  });

  const handleGenerate = async () => {
    // Reset previous errors
    setError(null);
    
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
      const { data: templateSections, error: sectionsError } = await supabase
        .from('template_sections')
        .select('*')
        .eq('template_id', selectedTemplateId)
        .order('order_index');

      if (sectionsError) {
        throw new Error(`Erreur de chargement des sections: ${sectionsError.message}`);
      }

      // Vérifier si le contenu des fichiers sélectionnés est disponible
      if (!selectedFilesData || selectedFilesData.length === 0) {
        throw new Error("Impossible de récupérer le contenu des fichiers");
      }

      // Extraire le contenu des transcriptions
      const transcriptionText = selectedFilesData
        .filter(file => file.content)
        .map(file => `--- ${file.name} ---\n${file.content || ''}`)
        .join('\n\n');

      const { data, error } = await supabase.functions.invoke('generate-note', {
        body: {
          youngProfile: profile,
          templateSections,
          selectedNotes: selectedFilesData.map(file => ({
            id: file.id,
            content: file.content
          })),
          transcriptionText
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Erreur de la fonction de génération: ${error.message}`);
      }

      if (!data || !data.content) {
        throw new Error("La réponse de l'IA ne contient pas de contenu généré");
      }

      setGeneratedContent(data.content);
      return "result";
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue est survenue";
      setError(errorMessage);
      toast({
        title: "Erreur de génération",
        description: errorMessage,
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
    setError(null);
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
    error,
    profileError,
    filesError,
    handleGenerate,
    handleReset,
    saveNote,
  };
}
