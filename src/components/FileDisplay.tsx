
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Loader2, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type FileDisplayProps = {
  folderId: string;
};

export function FileDisplay({ folderId }: FileDisplayProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  
  console.log("FileDisplay: Rendering for folderId", folderId);
  
  // Fetch files with refetch function
  const { 
    data: files = [], 
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['files', folderId],
    queryFn: async () => {
      console.log("FileDisplay: Fetching files for folder", folderId);
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('folder_id', folderId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching files:', error);
        throw error;
      }
      console.log("FileDisplay: Fetched files:", data);
      return data || [];
    },
    enabled: !!folderId
  });

  // Deletion mutation with improved error handling
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      console.log("FileDisplay: Starting deletion of file with ID", fileId);
      try {
        // Get the file info first to get the path
        const { data: fileData, error: fileError } = await supabase
          .from('files')
          .select('path')
          .eq('id', fileId)
          .single();

        if (fileError) {
          console.error('Error getting file data:', fileError);
          throw fileError;
        }

        if (!fileData) {
          throw new Error('File not found');
        }

        console.log("FileDisplay: File to delete:", fileData);

        // First delete from database to ensure it's gone even if storage deletion fails
        const { error: dbError } = await supabase
          .from('files')
          .delete()
          .eq('id', fileId);

        if (dbError) {
          console.error('Error deleting file from database:', dbError);
          throw dbError;
        }
        
        console.log("FileDisplay: Successfully deleted from database");

        // Only attempt to delete from storage if path exists and isn't empty
        if (fileData.path && fileData.path.trim() !== '') {
          console.log("FileDisplay: Attempting to delete from storage:", fileData.path);
          
          // Delete from storage
          const { error: storageError } = await supabase.storage
            .from('files')
            .remove([fileData.path]);

          if (storageError) {
            console.error('Error deleting file from storage:', storageError);
            // We don't throw here since the DB record is already deleted
            // Just log the error
          } else {
            console.log("FileDisplay: Successfully deleted from storage");
          }
        }
        
        return fileId;
      } catch (error) {
        console.error('Error in delete mutation:', error);
        throw error;
      }
    },
    onSuccess: (deletedFileId) => {
      console.log("FileDisplay: File deletion successful, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ['files', folderId] });
      queryClient.invalidateQueries({ queryKey: ['folder_counts'] });
      toast({ 
        title: "Fichier supprimé", 
        description: "Le fichier a été supprimé avec succès"
      });
      
      // Force refetch after successful deletion
      setTimeout(() => {
        refetch();
      }, 500);
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

  const handleDeleteFile = (fileId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    console.log("FileDisplay: Preparing to delete file:", fileId);
    setFileToDelete(fileId);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (fileToDelete) {
      console.log("FileDisplay: Confirming deletion of file:", fileToDelete);
      deleteFileMutation.mutate(fileToDelete);
      setConfirmOpen(false);
      setFileToDelete(null);
    }
  };

  const cancelDelete = () => {
    setConfirmOpen(false);
    setFileToDelete(null);
  };

  const formatSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  // Refetch files on mount
  useEffect(() => {
    if (folderId) {
      console.log("FileDisplay: Initial fetch for folder", folderId);
      refetch();
    }
  }, [folderId, refetch]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Aucun fichier dans ce dossier
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="h-[300px] rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Taille</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id}>
                <TableCell className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {file.name}
                </TableCell>
                <TableCell>{file.type}</TableCell>
                <TableCell>{formatSize(file.size)}</TableCell>
                <TableCell>
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => handleDeleteFile(file.id, e)}
                      disabled={deleteFileMutation.isPending && deleteFileMutation.variables === file.id}
                      className="h-8 w-8"
                    >
                      {deleteFileMutation.isPending && deleteFileMutation.variables === file.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce fichier ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-destructive text-destructive-foreground"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
