import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UseNoteGenerationProps, FileContent, Section } from "@/types/note-generation";
import { useSaveNote } from "@/hooks/use-save-note";

export function useNoteGeneration({ profileId, onSuccess }: UseNoteGenerationProps) {
  // Toast notification utility
  const { toast } = useToast();
  
  // State management
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [noteTitle, setNoteTitle] = useState<string>(`Note IA - ${new Date().toLocaleDateString("fr-FR")}`);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Initialize the save note mutation
  const saveNote = useSaveNote(profileId, onSuccess);

  // Helper to process a section of content
  const processSection = async (section: Section, fileContents: FileContent[]): Promise<string> => {
    console.log(`Processing section: "${section.title}"`);
    
    // Filter for relevant content based on section title and folder
    const relevantFiles = fileContents.filter(file => {
      const sectionLower = section.title.toLowerCase();
      const folderLower = file.folderName.toLowerCase();
      
      return (
        // Direct matches
        sectionLower.includes(folderLower) || 
        folderLower.includes(sectionLower) ||
        // Or files specifically marked as relevant to this section
        file.name.toLowerCase().includes(sectionLower)
      );
    });
    
    if (relevantFiles.length === 0) {
      return `*Aucune information n'a été trouvée pour cette section.*`;
    }
    
    // Concatenate content from all relevant files
    const relevantContent = relevantFiles
      .filter(file => file.content && file.content.length > 0)
      .map(file => file.content)
      .join('\n\n');
    
    if (!relevantContent) {
      return `*Aucune information n'a été trouvée pour cette section.*`;
    }
    
    return relevantContent;
  };

  const handleGenerate = useCallback(async () => {
    console.log('Starting note generation.');
    console.log('Selected folders:', selectedFolders);
    console.log('Selected files:', selectedFiles);
    
    if (selectedFolders.length === 0 && selectedFiles.length === 0) {
      toast({
        title: "Données manquantes",
        description: "Veuillez sélectionner au moins un dossier ou un fichier",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedTemplateId) {
      toast({
        title: "Modèle requis",
        description: "Veuillez sélectionner un modèle de note",
        variant: "destructive", 
      });
      return;
    }

    setIsGenerating(true);

    try {
      // 1. Fetch template and sections
      const { data: template, error: templateError } = await supabase
        .from("templates")
        .select("*")
        .eq("id", selectedTemplateId)
        .single();

      if (templateError) throw templateError;

      const { data: sections, error: sectionsError } = await supabase
        .from("template_sections")
        .select("*")
        .eq("template_id", selectedTemplateId)
        .order("order_index");

      if (sectionsError) throw sectionsError;
      console.log('Template and sections loaded:', { template, sectionsCount: sections?.length });

      // 2. Fetch file data
      let filesQuery = supabase
        .from("files")
        .select(`
          *,
          folders:folder_id (
            id,
            title
          )
        `);
      
      // Apply filters based on selection
      if (selectedFolders.length > 0) {
        filesQuery = filesQuery.in("folder_id", selectedFolders);
      }
      
      if (selectedFiles.length > 0) {
        if (selectedFolders.length > 0) {
          // If both folders and files are selected, use OR condition
          filesQuery = filesQuery.or(`folder_id.in.(${selectedFolders.join(',')}),id.in.(${selectedFiles.join(',')})`);
        } else {
          // If only files are selected
          filesQuery = filesQuery.in("id", selectedFiles);
        }
      }
      
      const { data: filesWithFolders, error: filesError } = await filesQuery;

      if (filesError) throw filesError;
      console.log('Files fetched:', filesWithFolders?.length || 0);

      // 3. Process file content
      const fileContents: FileContent[] = [];
      
      for (const file of filesWithFolders || []) {
        // Filter for relevant file types
        if (file.type === "transcription" || 
            file.type === "text" || 
            file.type === "text/plain" || 
            (file.name && file.name.toLowerCase().includes('transcription'))) {
          
          try {
            let content: string = '';
            
            // Check for content in database first
            if (file.content) {
              content = file.content;
            } 
            // If no content in database but file has path, download from storage
            else if (file.path) {
              const { data: storageData, error: downloadError } = await supabase.storage
                .from("files")
                .download(file.path);
              
              if (downloadError) {
                console.error('Error downloading file:', file.path, downloadError);
                continue;
              }
              
              content = await storageData.text();
            }
            
            if (content) {
              fileContents.push({
                id: file.id,
                name: file.name,
                content: content,
                type: file.type,
                folderName: file.folders?.title || ''
              });
            }
          } catch (error) {
            console.error('Error processing file:', file.name, error);
          }
        }
      }

      if (fileContents.length === 0) {
        throw new Error("Aucun fichier texte trouvé pour générer la note");
      }

      // 4. Generate content based on template structure
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
  }, [selectedTemplateId, selectedFolders, selectedFiles, toast]);

  const handleReset = useCallback(() => {
    setSelectedTemplateId("");
    setSelectedFolders([]);
    setSelectedFiles([]);
    setGeneratedContent("");
    setNoteTitle(`Note IA - ${new Date().toLocaleDateString("fr-FR")}`);
    setIsGenerating(false);
  }, []);

  return {
    selectedTemplateId,
    setSelectedTemplateId,
    selectedFolders,
    setSelectedFolders,
    selectedFiles,
    setSelectedFiles,
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