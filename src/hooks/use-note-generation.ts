
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UseNoteGenerationProps, FileContent } from "@/types/note-generation";
import { processSection } from "@/services/content-processor";
import { useSaveNote } from "@/hooks/use-save-note";
import { isTextMatch, normalizeText } from "@/utils/text-processing";

// Extend UseNoteGenerationProps to include state and state updaters
interface ExtendedUseNoteGenerationProps extends UseNoteGenerationProps {
  selectedTemplateId?: string;
  selectedFolders?: string[];
  selectedFiles?: string[];
  generatedContent?: string;
  noteTitle?: string;
  isGenerating?: boolean;
  setSelectedTemplateId?: (id: string) => void;
  setSelectedFolders?: (folders: string[]) => void;
  setSelectedFiles?: (files: string[]) => void;
  setGeneratedContent?: (content: string) => void;
  setNoteTitle?: (title: string) => void;
  setIsGenerating?: (isGenerating: boolean) => void;
}

export function useNoteGeneration({
  profileId,
  onSuccess,
  // Accept state from reducer (optional)
  selectedTemplateId: externalSelectedTemplateId,
  selectedFolders: externalSelectedFolders,
  selectedFiles: externalSelectedFiles,
  generatedContent: externalGeneratedContent,
  noteTitle: externalNoteTitle,
  isGenerating: externalIsGenerating,
  // Accept state updaters (optional)
  setSelectedTemplateId: externalSetSelectedTemplateId,
  setSelectedFolders: externalSetSelectedFolders,
  setSelectedFiles: externalSetSelectedFiles,
  setGeneratedContent: externalSetGeneratedContent,
  setNoteTitle: externalSetNoteTitle,
  setIsGenerating: externalSetIsGenerating
}: ExtendedUseNoteGenerationProps) {
  const { toast } = useToast();
  
  // Use external state if provided, otherwise use internal state
  const [selectedTemplateId, setSelectedTemplateIdInternal] = useState<string>(externalSelectedTemplateId || "");
  const [selectedFolders, setSelectedFoldersInternal] = useState<string[]>(externalSelectedFolders || []);
  const [selectedFiles, setSelectedFilesInternal] = useState<string[]>(externalSelectedFiles || []);
  const [generatedContent, setGeneratedContentInternal] = useState<string>(externalGeneratedContent || "");
  const [noteTitle, setNoteTitleInternal] = useState<string>(externalNoteTitle || `Note IA - ${new Date().toLocaleDateString("fr-FR")}`);
  const [isGenerating, setIsGeneratingInternal] = useState(externalIsGenerating || false);
  
  // Use external updaters if provided, otherwise use internal updaters
  const setSelectedTemplateId = externalSetSelectedTemplateId || setSelectedTemplateIdInternal;
  const setSelectedFolders = externalSetSelectedFolders || setSelectedFoldersInternal;
  const setSelectedFiles = externalSetSelectedFiles || setSelectedFilesInternal;
  const setGeneratedContent = externalSetGeneratedContent || setGeneratedContentInternal;
  const setNoteTitle = externalSetNoteTitle || setNoteTitleInternal;
  const setIsGenerating = externalSetIsGenerating || setIsGeneratingInternal;
  
  // Initialize the save note mutation, passing the profileId
  const saveNote = useSaveNote(profileId, onSuccess);

  const handleGenerate = async () => {
    // Get current state values
    const currentSelectedFolders = externalSelectedFolders || selectedFolders;
    const currentSelectedTemplateId = externalSelectedTemplateId || selectedTemplateId;
    const currentSelectedFiles = externalSelectedFiles || selectedFiles;
    
    if (currentSelectedFolders.length === 0 || !currentSelectedTemplateId) {
      toast({
        title: "Données manquantes",
        description: "Veuillez sélectionner au moins un dossier et un modèle",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Fetch template and sections
      const { data: template, error: templateError } = await supabase
        .from("templates")
        .select("*")
        .eq("id", currentSelectedTemplateId)
        .single();

      if (templateError) throw templateError;

      const { data: sections, error: sectionsError } = await supabase
        .from("template_sections")
        .select("*")
        .eq("template_id", currentSelectedTemplateId)
        .order("order_index");

      if (sectionsError) throw sectionsError;

      // Prépare la requête de base
      let query = supabase
        .from("files")
        .select(`
          *,
          folders:folder_id (
            id,
            title
          )
        `)
        .in("folder_id", currentSelectedFolders);
      
      // Ajoute le filtre pour les fichiers sélectionnés uniquement si la liste n'est pas vide
      if (currentSelectedFiles.length > 0) {
        query = query.in("id", currentSelectedFiles);
      }
      
      const { data: filesWithFolders, error: filesError } = await query;

      if (filesError) throw filesError;
      
      // Fetch content from storage for text files
      const fileContents: FileContent[] = [];
      
      for (const file of filesWithFolders || []) {
        if (file.type === "transcription" || file.type === "text" || file.type === "text/plain" || 
            (file.name && file.name.toLowerCase().includes('transcription'))) {
          try {
            let content: string = '';
            
            if (file.content) {
              content = file.content;
            } else if (file.path) {
              const { data: storageData, error: downloadError } = await supabase.storage
                .from("files")
                .download(file.path);
              
              if (downloadError) {
                continue;
              }
              
              content = await storageData.text();
            }
            
            if (content) {
              const fileContent = {
                id: file.id,
                name: file.name,
                content: content,
                type: file.type,
                folderName: file.folders?.title || ''
              };
              
              fileContents.push(fileContent);
            }
          } catch (error) {
            console.error('Error processing file:', file.name, error);
          }
        }
      }

      if (fileContents.length === 0) {
        throw new Error("Aucun fichier texte trouvé dans les dossiers sélectionnés");
      }

      // Generate content based on template structure
      let content = "";
      content += `# ${template.title}\n\n`;

      for (const section of sections || []) {
        content += `## ${section.title}\n\n`;
        
        // Process content for this section
        const sectionContent = await processSection(section, fileContents);
        content += `${sectionContent}\n\n`;
      }

      setGeneratedContent(content);
      setNoteTitle(`${template.title} - ${new Date().toLocaleDateString("fr-FR")}`);
      
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
    setSelectedTemplateId("");
    setSelectedFolders([]);
    setSelectedFiles([]);
    setGeneratedContent("");
    setNoteTitle(`Note IA - ${new Date().toLocaleDateString("fr-FR")}`);
    setIsGenerating(false);
  };

  return {
    selectedTemplateId: externalSelectedTemplateId || selectedTemplateId,
    setSelectedTemplateId,
    selectedFolders: externalSelectedFolders || selectedFolders,
    setSelectedFolders,
    selectedFiles: externalSelectedFiles || selectedFiles,
    setSelectedFiles,
    generatedContent: externalGeneratedContent || generatedContent,
    setGeneratedContent,
    noteTitle: externalNoteTitle || noteTitle,
    setNoteTitle,
    isGenerating: externalIsGenerating || isGenerating,
    handleGenerate,
    handleReset,
    saveNote
  };
}
