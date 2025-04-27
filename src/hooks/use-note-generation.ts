
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UseNoteGenerationProps } from "@/types/note-generation";
import { useYoungProfile } from "./use-young-profile";
import { useNoteFiles } from "./use-note-files";
import { useSaveNote } from "./use-save-note";

export function useNoteGeneration({ profileId, onSuccess }: UseNoteGenerationProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [generatedContent, setGeneratedContent] = useState("");
  const [noteTitle, setNoteTitle] = useState("Note IA - " + format(new Date(), "PPP", { locale: fr }));
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: profile, error: profileError } = useYoungProfile(profileId);
  const { selectedFilesData, filesError } = useNoteFiles(selectedFiles);
  const saveNote = useSaveNote(selectedTemplateId, onSuccess);

  const handleGenerate = async () => {
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

      if (!selectedFilesData || selectedFilesData.length === 0) {
        throw new Error("Impossible de récupérer le contenu des fichiers");
      }

      const transcriptionText = selectedFilesData
        .filter(file => file.content && !file.content.startsWith('[Erreur'))
        .map(file => `--- ${file.name} ---\n${file.content || ''}`)
        .join('\n\n');

      if (!transcriptionText) {
        throw new Error("Aucun contenu valide trouvé dans les fichiers sélectionnés");
      }

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
