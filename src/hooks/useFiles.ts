
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

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['files', folderId],
    queryFn: async () => {
      console.log("Fetching files for folder:", folderId);
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('folder_id', folderId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching files:", error);
        throw error;
      }
      console.log("Files fetched:", data?.length);
      return data || [];
    },
  });

  const handleDownload = async (file: FileType) => {
    try {
      setIsDownloading(file.id);
      
      if (!file.path) {
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
        throw new Error("Impossible de générer le lien de téléchargement");
      }
      
      // Create and trigger download
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
      console.error("Download error:", error);
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
      console.log("Starting file deletion process for:", fileId);
      setDeletingFileId(fileId); // Track which file is being deleted
      
      try {
        // Get file path first
        const { data: fileData } = await supabase
          .from('files')
          .select('path')
          .eq('id', fileId)
          .single();

        console.log("File data for deletion:", fileData);

        // Remove from storage if path exists
        if (fileData?.path) {
          const { error: storageError } = await supabase.storage
            .from('files')
            .remove([fileData.path]);

          if (storageError) {
            console.error('Storage removal error:', storageError);
            // Continue with database deletion even if storage removal fails
          }
        }

        // Delete from database
        const { error: dbError } = await supabase
          .from('files')
          .delete()
          .eq('id', fileId);

        if (dbError) {
          console.error('Database deletion error:', dbError);
          throw dbError;
        }
        
        return fileId;
      } catch (error) {
        console.error("Complete deletion error:", error);
        throw error;
      }
    },
    onSuccess: (deletedFileId) => {
      console.log("File deleted successfully:", deletedFileId);
      queryClient.invalidateQueries({ queryKey: ['files', folderId] });
      toast({ 
        title: "Fichier supprimé", 
        description: "Le fichier a été supprimé avec succès"
      });
    },
    onError: (error) => {
      console.error("Delete mutation error:", error);
      toast({
        title: "Erreur lors de la suppression",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always clear the deleting state when operation completes (success or error)
      setDeletingFileId(null);
    }
  });

  const renameMutation = useMutation({
    mutationFn: async ({ fileId, newName }: { fileId: string; newName: string }) => {
      const { data, error } = await supabase
        .from('files')
        .update({ name: newName })
        .eq('id', fileId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', folderId] });
      toast({ 
        title: "Fichier renommé", 
        description: "Le fichier a été renommé avec succès" 
      });
    },
    onError: (error) => {
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
    deleteFile: (fileId: string) => {
      console.log("Delete file requested for:", fileId);
      deleteMutation.mutate(fileId);
    },
    isDeleting: deleteMutation.isPending,
    isDeletingFile: (fileId: string) => deletingFileId === fileId,
    renameFile: renameMutation.mutate,
    isRenaming: renameMutation.isPending,
  };
}
