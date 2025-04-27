import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UseNoteGenerationProps, FileContent } from "@/types/note-generation";
import { processSection } from "@/services/content-processor";

export function useNoteGeneration({ profileId, onSuccess }: UseNoteGenerationProps) {
  const { toast } = useToast();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [noteTitle, setNoteTitle] = useState<string>(`Note IA - ${new Date().toLocaleDateString("fr-FR")}`);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    console.log('Starting note generation. Selected folders:', selectedFolders);
    
    if (selectedFolders.length === 0 || !selectedTemplateId) {
      console.log('Missing required data:', { selectedFolders, selectedTemplateId });
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
      const { data: filesWithFolders, error: filesError } = await supabase
        .from("files")
        .select(`
          *,
          folders:folder_id (
            id,
            title
          )
        `)
        .in("folder_id", selectedFolders);

      if (filesError) throw filesError;
      console.log('Files fetched with folders:', { filesCount: filesWithFolders?.length });

      const fileContents: FileContent[] = [];
      
      for (const file of filesWithFolders || []) {
        if (file.type === "transcription" || file.type === "text" || file.type === "text/plain") {
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
      
      toast({
        title: "Note générée avec succès",
        description: "Vous pouvez maintenant éditer et sauvegarder la note.",
      });

    } catch (error) {
      console.error("Error generating note:", error);
      toast({
        title: "Erreur",
        description: "Impossible de générer la note. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveNote = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const { data: note, error } = await supabase
        .from("profile_notes")
        .insert({
          profile_id: profileId,
          title: data.title,
          content: data.content,
          type: "generated",
        })
        .select()
        .single();

      if (error) throw error;
      return note;
    },
    onSuccess: () => {
      toast({
        title: "Note sauvegardée",
        description: "La note a été sauvegardée avec succès",
      });
      handleReset();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder la note",
        variant: "destructive",
      });
    },
  });

  const handleReset = () => {
    setSelectedTemplateId("");
    setSelectedFolders([]);
    setGeneratedContent("");
    setNoteTitle(`Note IA - ${new Date().toLocaleDateString("fr-FR")}`);
    setIsGenerating(false);
  };

  return {
    selectedTemplateId,
    setSelectedTemplateId,
    selectedFolders,
    setSelectedFolders,
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
