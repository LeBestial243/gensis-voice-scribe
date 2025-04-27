
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileWithContent } from "@/types/note-generation";

export function useNoteFiles(selectedFiles: string[]) {
  const [error, setError] = useState<string | null>(null);

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
          size,
          folder_id,
          content
        `)
        .in('id', selectedFiles);
      
      if (error) {
        console.error('Error fetching files data:', error);
        throw new Error(`Erreur de chargement des fichiers: ${error.message}`);
      }
      if (!filesData) return [];

      const filesWithContent: FileWithContent[] = [];
      
      for (const file of filesData) {
        if (file.content) {
          filesWithContent.push({ ...file });
          continue;
        }

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

  return {
    selectedFilesData,
    filesError,
    error
  };
}
