
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UseNoteGenerationProps, FileContent } from "@/types/note-generation";
import { processSection } from "@/services/content-processor";
import { useSaveNote } from "@/hooks/use-save-note";
import { isTextMatch, normalizeText } from "@/utils/text-processing";

// Define the parameters for generating a note
interface GenerateParams {
  files: FileContent[];
  templateId: string | null;
}

export function useNoteGeneration({
  profileId,
  onSuccess,
}: UseNoteGenerationProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [noteTitle, setNoteTitle] = useState(`Note IA - ${new Date().toLocaleDateString("fr-FR")}`);
  
  // Initialize the save note mutation, passing the profileId
  const saveNote = useSaveNote(profileId, onSuccess);

  const handleGenerate = async ({ files, templateId }: GenerateParams) => {
    if (!templateId && files.length === 0) {
      toast({
        title: "Données manquantes",
        description: "Veuillez sélectionner au moins un fichier ou un modèle",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Fetch template and sections if a template is selected
      let content = "";
      let templateTitle = "";
      
      if (templateId) {
        const { data: template, error: templateError } = await supabase
          .from("templates")
          .select("*")
          .eq("id", templateId)
          .single();

        if (templateError) throw templateError;

        const { data: sections, error: sectionsError } = await supabase
          .from("template_sections")
          .select("*")
          .eq("template_id", templateId)
          .order("order_index");

        if (sectionsError) throw sectionsError;
        
        templateTitle = template.title;

        // Generate content based on template structure
        content += `# ${template.title}\n\n`;

        for (const section of sections || []) {
          content += `## ${section.title}\n\n`;
          
          // Process content for this section
          const sectionContent = await processSection(section, files);
          content += `${sectionContent}\n\n`;
        }
      } else {
        // Simple content generation without a template
        content = "# Synthèse des documents\n\n";
        
        for (const file of files) {
          content += `## ${file.name}\n\n`;
          content += `${file.content.substring(0, 500)}...\n\n`;
        }
      }

      setGeneratedContent(content);
      if (templateTitle) {
        setNoteTitle(`${templateTitle} - ${new Date().toLocaleDateString("fr-FR")}`);
      }
      
      toast({
        title: "Note générée avec succès",
        description: "Vous pouvez maintenant éditer et sauvegarder la note.",
      });

    } catch (error) {
      console.error("Error generating note:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de générer la note. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setGeneratedContent("");
    setNoteTitle(`Note IA - ${new Date().toLocaleDateString("fr-FR")}`);
    setIsGenerating(false);
  };

  return {
    generatedContent,
    setGeneratedContent,
    noteTitle,
    setNoteTitle,
    isGenerating,
    handleGenerate,
    handleReset,
    saveNote
  };
}
