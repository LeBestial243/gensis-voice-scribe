
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type FileType = {
  id: string;
  name: string;
  type: string;
  size: number;
  created_at: string;
  path: string;
};

export function useFileOperations(folderId: string, refetchFiles: () => void) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const renameFileMutation = useMutation({
    mutationFn: async ({ fileId, newName }: { fileId: string; newName: string }) => {
      console.log("Renaming file", fileId, "to", newName);
      const { data, error } = await supabase
        .from('files')
        .update({ name: newName })
        .eq('id', fileId)
        .select()
        .single();

      if (error) {
        console.error("Error renaming file:", error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', folderId] });
      toast({ 
        title: "Fichier renommé", 
        description: "Le fichier a été renommé avec succès" 
      });
      refetchFiles();
    },
    onError: (error) => {
      console.error("Rename error:", error);
      toast({
        title: "Erreur lors du renommage",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive",
      });
    }
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      try {
        const { data: fileData, error: fileError } = await supabase
          .from('files')
          .select('path, name')
          .eq('id', fileId)
          .single();

        if (fileError) throw fileError;
        if (!fileData) throw new Error('File not found');

        if (fileData.path && fileData.path.trim() !== '') {
          const { error: storageError } = await supabase.storage
            .from('files')
            .remove([fileData.path]);

          if (storageError) {
            console.error('Error deleting file from storage:', storageError);
          }
        }

        const { error: dbError } = await supabase
          .from('files')
          .delete()
          .eq('id', fileId);

        if (dbError) throw dbError;
        
        return {
          id: fileId,
          name: fileData.name
        };
      } catch (error) {
        console.error('Error in delete mutation:', error);
        throw error;
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['files', folderId] });
      queryClient.invalidateQueries({ queryKey: ['folder_counts'] });
      toast({ 
        title: "Fichier supprimé", 
        description: `Le fichier "${result.name}" a été supprimé avec succès`
      });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({
        title: "Erreur lors de la suppression",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive",
      });
    },
  });

  return {
    renameFileMutation,
    deleteFileMutation
  };
}
