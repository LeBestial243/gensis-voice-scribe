
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type FileType = {
  id: string;
  name: string;
  type: string;
  size: number;
  path: string;
  created_at: string;
  content?: string | null;
};

export function useFiles(folderId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  // Debug log when hook is called
  console.log("useFiles hook called with folderId:", folderId);

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['files', folderId],
    queryFn: async () => {
      console.log('useFiles: Fetching files for folder', folderId);
      
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('folder_id', folderId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('useFiles: Error fetching files', error);
        throw error;
      }

      console.log('useFiles: Files fetched successfully:', data ? data.length : 0, 'files found');
      if (data && data.length > 0) {
        console.log('useFiles: First file sample:', { 
          id: data[0].id,
          name: data[0].name,
          type: data[0].type
        });
      }
      
      return data || [];
    },
    enabled: !!folderId,
  });

  const handleDownload = async (file: FileType) => {
    try {
      setIsDownloading(file.id);
      console.log('useFiles: Downloading file', file.id, file.name);
      
      if (!file.path) {
        console.error('useFiles: Missing path for file', file.id);
        toast({
          title: "Erreur de téléchargement",
          description: "Ce fichier ne peut pas être téléchargé (chemin manquant)",
          variant: "destructive",
        });
        return;
      }
      
      const { data, error } = await supabase
        .storage
        .from('files')
        .createSignedUrl(file.path, 60);
      
      if (error || !data?.signedUrl) {
        console.error('useFiles: Error creating signed URL', error);
        throw new Error("Impossible de générer le lien de téléchargement");
      }
      
      console.log('useFiles: Download URL generated successfully');
      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Téléchargement réussi",
        description: `Le fichier "${file.name}" a été téléchargé`,
      });
    } catch (error) {
      console.error('useFiles: Download error', error);
      toast({
        title: "Erreur de téléchargement",
        description: "Une erreur s'est produite lors du téléchargement",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(null);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      console.log('useFiles: Starting delete for file', fileId);
      setDeletingFileId(fileId);
      
      try {
        const { data: fileData } = await supabase
          .from('files')
          .select('path')
          .eq('id', fileId)
          .single();

        console.log('useFiles: File data for deletion:', fileData);

        if (fileData?.path) {
          try {
            console.log('useFiles: Attempting to delete file from storage:', fileData.path);
            const { error: storageError } = await supabase.storage
              .from('files')
              .remove([fileData.path]);

            if (storageError) {
              console.warn('useFiles: Storage removal error, continuing with DB deletion', storageError);
              // Continue with database deletion even if storage removal fails
            } else {
              console.log('useFiles: Storage file deleted successfully');
            }
          } catch (storageErr) {
            console.warn('useFiles: Storage operation failed, continuing with DB deletion', storageErr);
            // Continue with database deletion even if storage operation fails
          }
        }

        console.log('useFiles: Deleting file from database');
        const { error: dbError } = await supabase
          .from('files')
          .delete()
          .eq('id', fileId);

        if (dbError) {
          console.error('useFiles: Database deletion error', dbError);
          throw dbError;
        }
        
        console.log('useFiles: File successfully deleted from database');
        return fileId;
      } catch (error) {
        console.error('useFiles: Delete operation failed', error);
        throw error;
      }
    },
    onSuccess: (deletedFileId) => {
      console.log('useFiles: Delete mutation succeeded, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['files', folderId] });
      queryClient.invalidateQueries({ queryKey: ['folder_counts'] });
      
      toast({ 
        title: "Fichier supprimé", 
        description: "Le fichier a été supprimé avec succès"
      });
    },
    onError: (error) => {
      console.error('useFiles: Delete mutation error', error);
      toast({
        title: "Erreur lors de la suppression",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive",
      });
    },
    onSettled: () => {
      console.log('useFiles: Delete mutation settled');
      setDeletingFileId(null);
    }
  });

  const renameMutation = useMutation({
    mutationFn: async ({ fileId, newName }: { fileId: string; newName: string }) => {
      console.log('useFiles: Starting rename for file', fileId, 'to', newName);
      
      const { data, error } = await supabase
        .from('files')
        .update({ name: newName })
        .eq('id', fileId)
        .select()
        .single();

      if (error) {
        console.error('useFiles: Rename error', error);
        throw error;
      }
      
      console.log('useFiles: Rename successful', data);
      return data;
    },
    onSuccess: () => {
      console.log('useFiles: Rename mutation succeeded, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['files', folderId] });
      
      toast({ 
        title: "Fichier renommé", 
        description: "Le fichier a été renommé avec succès" 
      });
    },
    onError: (error) => {
      console.error('useFiles: Rename mutation error', error);
      toast({
        title: "Erreur lors du renommage",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive",
      });
    },
  });

  return {
    files,
    isLoading,
    isDownloading,
    handleDownload,
    deleteFile: (fileId: string) => deleteMutation.mutate(fileId),
    isDeleting: deleteMutation.isPending,
    isDeletingFile: (fileId: string) => deletingFileId === fileId,
    renameFile: renameMutation.mutate,
    isRenaming: renameMutation.isPending,
  };
}
