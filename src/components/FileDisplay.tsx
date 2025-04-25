
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFileStorage } from "@/hooks/use-files-storage";
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
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { deleteFile } = useFileStorage(folderId);
  
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
      try {
        const { data, error } = await supabase
          .from('files')
          .select('*')
          .eq('folder_id', folderId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching files:', error);
          throw error;
        }
        console.log("FileDisplay: Fetched files:", data?.length || 0, "files");
        return data || [];
      } catch (e) {
        console.error('Exception in file fetch:', e);
        throw e;
      }
    },
    enabled: !!folderId,
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
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
      deleteFile.mutate(fileToDelete, {
        onSuccess: () => {
          console.log("FileDisplay: Delete successful, forcing refetch");
          // Force a refetch after successful deletion
          setTimeout(() => {
            refetch();
          }, 500);
        }
      });
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
                      disabled={deleteFile.isPending && deleteFile.variables === file.id}
                      className="h-8 w-8"
                    >
                      {deleteFile.isPending && deleteFile.variables === file.id ? (
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
