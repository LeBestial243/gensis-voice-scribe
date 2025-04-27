
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
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]); // Changed from selectedFiles
  const [generatedContent, setGeneratedContent] = useState("");
  const [noteTitle, setNoteTitle] = useState("Note IA - " + format(new Date(), "PPP", { locale: fr }));
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: profile, error: profileError } = useYoungProfile(profileId);
  // We're no longer using the selectedFilesData directly
  const saveNote = useSaveNote(onSuccess);

  const handleGenerate = async () => {
    setError(null);
    
    if (!selectedTemplateId || selectedFolders.length === 0 || !profile) {
      toast({
        title: "Données manquantes",
        description: "Veuillez sélectionner un template et au moins un dossier",
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

      // Now we pass the selectedFolders to the edge function instead of selectedFiles
      const { data, error } = await supabase.functions.invoke('generate-note', {
        body: {
          youngProfile: profile,
          templateSections,
          selectedFolders
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
    setSelectedFolders([]); // Changed from setSelectedFiles
    setGeneratedContent("");
    setError(null);
    setNoteTitle("Note IA - " + format(new Date(), "PPP", { locale: fr }));
  };

  return {
    selectedTemplateId,
    setSelectedTemplateId,
    selectedFolders, // Changed from selectedFiles
    setSelectedFolders, // Changed from setSelectedFiles
    generatedContent,
    setGeneratedContent,
    noteTitle,
    setNoteTitle,
    isGenerating,
    error,
    profileError,
    handleGenerate,
    handleReset,
    saveNote,
  };
}
