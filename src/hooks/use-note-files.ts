
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileWithContent } from "@/types/note-generation";
import { useErrorHandler } from "@/utils/errorHandler";

export function useNoteFiles(selectedFiles: string[]) {
  const { handleError } = useErrorHandler();

  const { data: selectedFilesData = [], error: filesError } = useQuery<FileWithContent[]>({
    queryKey: ['selected_files_content', selectedFiles],
    queryFn: async () => {
      if (selectedFiles.length === 0) return [];

      try {
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
        
        if (error) throw error;
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
              handleError(downloadError, `Téléchargement du fichier ${file.name}`, false);
              filesWithContent.push({ 
                ...file, 
                content: `[Erreur de chargement: ${downloadError.message}]`
              });
              continue;
            }

            const content = await fileContent.text();
            filesWithContent.push({ ...file, content });
          } catch (fileError) {
            const errorMessage = fileError instanceof Error ? fileError.message : "erreur inconnue";
            handleError(fileError, `Traitement du fichier ${file.name}`, false);
            filesWithContent.push({ 
              ...file, 
              content: `[Erreur de traitement: ${errorMessage}]`
            });
          }
        }
        
        return filesWithContent;
      } catch (error) {
        throw handleError(error, "Chargement des fichiers", false).message;
      }
    },
    enabled: selectedFiles.length > 0,
    retry: 2,
    meta: {
      onError: (error: unknown) => {
        handleError(error, "Chargement des fichiers");
      }
    }
  });

  return {
    selectedFilesData,
    filesError
  };
}
