import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UseNoteGenerationProps, FileContent } from "@/types/note-generation";
import { processSection } from "@/services/content-processor";
import { useSaveNote } from "@/hooks/use-save-note";
import { isTextMatch, normalizeText } from "@/utils/text-processing";

export function useNoteGeneration({ profileId, onSuccess }: UseNoteGenerationProps) {
  const { toast } = useToast();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [noteTitle, setNoteTitle] = useState<string>(`Note IA - ${new Date().toLocaleDateString("fr-FR")}`);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Initialize the save note mutation, passing the profileId
  const saveNote = useSaveNote(profileId, onSuccess);

  const handleGenerate = async () => {
    console.log('Starting note generation.');
    console.log('Selected folders:', selectedFolders);
    console.log('Selected files:', selectedFiles);
    
    if (selectedFolders.length === 0 || !selectedTemplateId) {
      console.log('Missing required data:', { selectedFolders, selectedTemplateId });
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

      // Fetch all files for selected folders with folder information
      console.log('Fetching files for folders:', selectedFolders);
      
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
        .in("folder_id", selectedFolders);
      
      // Ajoute le filtre pour les fichiers sélectionnés uniquement si la liste n'est pas vide
      if (selectedFiles.length > 0) {
        console.log('Filtering for specific files:', selectedFiles);
        query = query.in("id", selectedFiles);
      }
      
      const { data: filesWithFolders, error: filesError } = await query;

      if (filesError) throw filesError;
      console.log('Files fetched with folders:', { filesCount: filesWithFolders?.length });
      
      if (filesWithFolders && filesWithFolders.length > 0) {
        console.log('Sample files:', filesWithFolders.slice(0, 3).map(f => ({ 
          id: f.id,
          name: f.name,
          type: f.type,
          folderTitle: f.folders?.title
        })));
      }

      // Fetch content from storage for text files
      const fileContents: FileContent[] = [];
      
      for (const file of filesWithFolders || []) {
        if (file.type === "transcription" || file.type === "text" || file.type === "text/plain" || 
            (file.name && file.name.toLowerCase().includes('transcription'))) {
          console.log('Processing file:', { 
            name: file.name, 
            type: file.type, 
            path: file.path,
            folderTitle: file.folders?.title 
          });
          
          try {
            let content: string = '';
            
            if (file.content) {
              console.log('Using database content for:', file.name);
              content = file.content;
            } else if (file.path) {
              const { data: storageData, error: downloadError } = await supabase.storage
                .from("files")
                .download(file.path);
              
              if (downloadError) {
                console.error('Error downloading file:', file.path, downloadError);
                continue;
              }
              
              content = await storageData.text();
              console.log('Downloaded content for:', file.name, 'Content length:', content.length);
            }
            
            if (content) {
              const fileContent = {
                id: file.id,
                name: file.name,
                content: content,
                type: file.type,
                folderName: file.folders?.title || ''
              };
              
              console.log('Adding file to fileContents:', {
                name: fileContent.name,
                folderName: fileContent.folderName,
                contentPreview: fileContent.content.substring(0, 100) + '...'
              });
              
              fileContents.push(fileContent);
            }
          } catch (error) {
            console.error('Error processing file:', file.name, error);
          }
        }
      }

      console.log('File contents prepared:', { 
        contentsCount: fileContents.length,
        folders: fileContents.map(f => ({ name: f.name, folder: f.folderName }))
      });

      if (fileContents.length === 0) {
        throw new Error("Aucun fichier texte trouvé dans les dossiers sélectionnés");
      }

      // Generate content based on template structure
      let content = "";
      content += `# ${template.title}\n\n`;

      console.log('=== Starting to process template sections ===');
      console.log('Sections to process:', sections?.map(s => s.title));

      for (const section of sections || []) {
        console.log(`\n=== PROCESSING SECTION: "${section.title}" ===`);
        content += `## ${section.title}\n\n`;
        
        // Process content for this section
        const sectionContent = await processSection(section, fileContents);
        content += `${sectionContent}\n\n`;
        
        console.log(`Section "${section.title}" processed. Content: ${sectionContent.substring(0, 50)}...`);
      }

      setGeneratedContent(content);
      setNoteTitle(`${template.title} - ${new Date().toLocaleDateString("fr-FR")}`);
      
      console.log('Note generation completed');
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
