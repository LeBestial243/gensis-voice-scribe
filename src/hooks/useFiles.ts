
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { fileService } from "@/services/fileService";
import { FileType } from "@/types/files";
import { useErrorHandler } from "@/utils/errorHandler";

export type { FileType };

export function useFiles(folderId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  const { data: files = [], isLoading, error } = useQuery({
    queryKey: ['files', folderId],
    queryFn: () => fileService.getFiles(folderId),
    enabled: !!folderId,
    meta: {
      onError: (error: unknown) => {
        handleError(error, "Chargement des fichiers");
      }
    }
  });

  const handleDownload = async (file: FileType) => {
    try {
      setIsDownloading(file.id);
      
      const signedUrl = await fileService.downloadFile(file);
      
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
      handleError(error, "Téléchargement du fichier");
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
      handleError(error, "Suppression du fichier");
    },
    onSettled: () => {
      setDeletingFileId(null);
    }
  });

  const renameMutation = useMutation({
    mutationFn: async ({ fileId, newName }: { fileId: string; newName: string }) => {
      return await fileService.renameFile(fileId, newName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', folderId] });
      
      toast({ 
        title: "Fichier renommé", 
        description: "Le fichier a été renommé avec succès" 
      });
    },
    onError: (error) => {
      handleError(error, "Renommage du fichier");
    },
  });

  return {
    files,
    isLoading,
    error,
    isDownloading,
    handleDownload,
    deleteFile: (fileId: string) => deleteMutation.mutate(fileId),
    isDeleting: deleteMutation.isPending,
    isDeletingFile: (fileId: string) => deletingFileId === fileId,
    renameFile: renameMutation.mutate,
    isRenaming: renameMutation.isPending,
  };
}
