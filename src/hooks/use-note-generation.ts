
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

      // D'abord, récupérer les fichiers avec leur contenu depuis la base de données
      const { data: filesData, error } = await supabase
        .from('files')
        .select(`
          id,
          name,
          type,
          created_at,
          updated_at,
          path,
          size,
          content
        `)
        .in('id', selectedFiles);
      
      if (error) {
        console.error('Error fetching files data:', error);
        throw new Error(`Erreur de chargement des fichiers: ${error.message}`);
      }
      if (!filesData) return [];

      // Pour chaque fichier, vérifier si le contenu est déjà disponible
      const filesWithContent: FileWithContent[] = [];
      
      for (const file of filesData) {
        // Si le contenu est déjà dans la base de données, l'utiliser directement
        if (file.content) {
          filesWithContent.push({ 
            ...file, 
            content: file.content
          });
          continue;
        }

        // Sinon, essayer de le récupérer depuis le storage
        try {
          if (!file.path) {
            filesWithContent.push({ 
              ...file, 
              content: `[Erreur: Chemin du fichier manquant]`
            });
            continue;
          }

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
    console.log("Début génération de note...");
    // Reset previous errors
    setError(null);
    
    if (!selectedTemplateId || selectedFiles.length === 0 || !profile) {
      console.log("Données manquantes:", { 
        selectedTemplateId, 
        selectedFilesCount: selectedFiles.length,
        profileExists: !!profile 
      });
      toast({
        title: "Données manquantes",
        description: "Veuillez sélectionner un template et au moins un fichier",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      console.log("Récupération des sections du template...");
      const { data: templateSections, error: sectionsError } = await supabase
        .from('template_sections')
        .select('*')
        .eq('template_id', selectedTemplateId)
        .order('order_index');

      if (sectionsError) {
        throw new Error(`Erreur de chargement des sections: ${sectionsError.message}`);
      }
      
      console.log("Sections récupérées:", templateSections);

      // Vérifier si le contenu des fichiers sélectionnés est disponible
      if (!selectedFilesData || selectedFilesData.length === 0) {
        console.error("Aucun fichier avec contenu trouvé");
        throw new Error("Impossible de récupérer le contenu des fichiers");
      }

      console.log("Fichiers sélectionnés avec contenu:", selectedFilesData.map(f => f.name));

      // Filtrer et nettoyer les données de transcription
      const validFiles = selectedFilesData.filter(file => 
        file.content && typeof file.content === 'string' && !file.content.startsWith('[Erreur')
      );

      if (validFiles.length === 0) {
        console.error("Aucun fichier valide trouvé parmi les fichiers sélectionnés");
        throw new Error("Aucun contenu valide trouvé dans les fichiers sélectionnés");
      }

      // Extraire le contenu des transcriptions
      const transcriptionText = validFiles
        .map(file => `--- ${file.name} ---\n${file.content || ''}`)
        .join('\n\n');

      console.log("Envoi à la fonction generate-note avec données:", {
        profileId: profile.id,
        templateId: selectedTemplateId,
        sectionsCount: templateSections.length,
        transcriptionLength: transcriptionText.length,
      });

      const { data, error } = await supabase.functions.invoke('generate-note', {
        body: {
          youngProfile: profile,
          templateSections,
          selectedNotes: validFiles.map(file => ({
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

      console.log("Réponse de la fonction generate-note:", data);

      if (!data || !data.content) {
        console.error("Réponse invalide de l'API:", data);
        throw new Error("La réponse de l'IA ne contient pas de contenu généré");
      }

      console.log("Contenu généré avec succès");
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
