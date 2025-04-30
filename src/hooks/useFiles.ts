
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
  
  // 1. Standardized loading state
  const [loading, setLoading] = useState({
    downloading: null as string | null,
    deleting: null as string | null,
  });

  // 2. Consistent query structure
  const filesQuery = useQuery({
    queryKey: ['files', folderId],
    queryFn: () => fileService.getFiles(folderId),
    enabled: !!folderId,
    meta: {
      onError: (error: unknown) => {
        handleError(error, "Chargement des fichiers");
      }
    }
  });

  // 3. Standardized mutation structure
  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      setLoading(prev => ({ ...prev, deleting: fileId }));
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
      setLoading(prev => ({ ...prev, deleting: null }));
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

  // 4. Standardized operation functions
  const handleDownload = async (file: FileType) => {
    try {
      setLoading(prev => ({ ...prev, downloading: file.id }));
      
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
      setLoading(prev => ({ ...prev, downloading: null }));
    }
  };

  // 5. Standardized return structure
  return {
    data: {
      files: filesQuery.data || [],
    },
    operations: {
      handleDownload,
      deleteFile: (fileId: string) => deleteMutation.mutate(fileId),
      renameFile: renameMutation.mutate,
    },
    status: {
      isLoading: filesQuery.isLoading,
      isError: !!filesQuery.error,
      isDeleting: deleteMutation.isPending,
      isRenaming: renameMutation.isPending,
      isDownloading: (fileId: string) => loading.downloading === fileId,
      isDeletingFile: (fileId: string) => loading.deleting === fileId,
      loadingState: loading
    }
  };
}
