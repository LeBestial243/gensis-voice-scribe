
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { fileService } from "@/services/fileService";
import { FileType } from "@/types/files";

export type { FileType };

export function useFiles(folderId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['files', folderId],
    queryFn: async () => {
      if (!folderId) return [];
      
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('folder_id', folderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!folderId,
  });

  const handleDownload = async (file: FileType) => {
    try {
      setIsDownloading(file.id);
      
      // Fix type mismatch by ensuring the file has all required properties
      const fileData = {
        id: file.id,
        name: file.name,
        type: file.type,
        size: file.size,
        path: file.path,
        folder_id: folderId,
        created_at: file.created_at,
        updated_at: file.created_at,
        content: file.content
      };
      
      const signedUrl = await fileService.downloadFile(fileData);
      
      const a = document.createElement('a');
      a.href = signedUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Téléchargement réussi",
        description: `Le fichier "${file.name}" a été téléchargé`,
      });
    } catch (error) {
      toast({
        title: "Erreur de téléchargement",
        description: error instanceof Error ? error.message : "Une erreur s'est produite lors du téléchargement",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(null);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      setDeletingFileId(fileId);
      return await fileService.deleteFile(fileId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', folderId] });
      queryClient.invalidateQueries({ queryKey: ['folder_counts'] });
      
      toast({ 
        title: "Fichier supprimé", 
        description: "Le fichier a été supprimé avec succès"
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur lors de la suppression",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive",
      });
    },
    onSettled: () => {
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
    deleteFile: (fileId: string) => deleteMutation.mutate(fileId),
    isDeleting: deleteMutation.isPending,
    isDeletingFile: (fileId: string) => deletingFileId === fileId,
    renameFile: renameMutation.mutate,
    isRenaming: renameMutation.isPending,
  };
}
