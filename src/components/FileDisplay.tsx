
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  File, 
  FileImage, 
  FileText, 
  FileVideo,
  FileArchive,
  Download,
  Trash2, 
  Loader2,
  Pencil 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";

type FileDisplayProps = {
  folderId: string;
};

type FileType = {
  id: string;
  name: string;
  type: string;
  size: number;
  created_at: string;
  path: string;
};

export function FileDisplay({ folderId }: FileDisplayProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [fileToRename, setFileToRename] = useState<FileType | null>(null);
  const [newFileName, setNewFileName] = useState("");

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

      if (error) throw error;
      return data || [];
    },
    enabled: !!folderId,
  });

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
      // Invalidate and refetch files query to update UI with new name
      queryClient.invalidateQueries({ queryKey: ['files', folderId] });
      toast({ 
        title: "Fichier renommé", 
        description: "Le fichier a été renommé avec succès" 
      });
      setIsRenameOpen(false);
      setFileToRename(null);
      setNewFileName("");
      // Refetch files to ensure UI is updated
      refetch();
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
        // Get the file info first to get the path
        const { data: fileData, error: fileError } = await supabase
          .from('files')
          .select('path, name')
          .eq('id', fileId)
          .single();

        if (fileError) {
          console.error('Error getting file data:', fileError);
          throw fileError;
        }

        if (!fileData) {
          throw new Error('File not found');
        }

        // Only attempt to delete from storage if path exists and isn't empty
        if (fileData.path && fileData.path.trim() !== '') {
          // Delete from storage
          const { error: storageError } = await supabase.storage
            .from('files')
            .remove([fileData.path]);

          if (storageError) {
            console.error('Error deleting file from storage:', storageError);
            // We don't throw here because we still want to delete the database record
            // Just log the error
          }
        }

        // Delete from database
        const { error: dbError } = await supabase
          .from('files')
          .delete()
          .eq('id', fileId);

        if (dbError) {
          console.error('Error deleting file from database:', dbError);
          throw dbError;
        }
        
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

  const handleDeleteFile = (fileId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setFileToDelete(fileId);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (fileToDelete) {
      deleteFileMutation.mutate(fileToDelete);
      setConfirmOpen(false);
      setFileToDelete(null);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) {
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    if (type.includes('image')) {
      return <FileImage className="h-8 w-8 text-blue-500" />;
    }
    if (type.includes('zip') || type.includes('rar')) {
      return <FileArchive className="h-8 w-8 text-amber-500" />;
    }
    if (type.includes('document') || type.includes('word')) {
      return <FileText className="h-8 w-8 text-emerald-500" />;
    }
    if (type.includes('video')) {
      return <FileVideo className="h-8 w-8 text-purple-500" />;
    }
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const handleRenameFile = (file: FileType, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    console.log("Opening rename dialog for file:", file.name);
    setFileToRename(file);
    setNewFileName(file.name);
    setIsRenameOpen(true);
  };

  const confirmRename = () => {
    if (fileToRename && newFileName.trim()) {
      console.log("Confirming rename of file:", fileToRename.id, "to", newFileName.trim());
      renameFileMutation.mutate({
        fileId: fileToRename.id,
        newName: newFileName.trim()
      });
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-md">
            <div className="flex items-start space-x-4">
              {/* Placeholder for file icon */}
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-lg bg-muted/50">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Aucun fichier</h3>
        <p className="text-muted-foreground">
          Aucun fichier n'a été ajouté à ce dossier
        </p>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="h-[500px] w-full pr-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file: FileType) => (
            <div 
              key={file.id}
              className="group bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start space-x-4">
                {getFileIcon(file.type)}
                <div className="flex-1 min-w-0">
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <h3 className="font-medium text-sm truncate">
                        {file.name}
                      </h3>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                  <p className="text-xs text-muted-foreground mt-1">
                    {file.created_at && format(new Date(file.created_at), 'PPp', { locale: fr })}
                  </p>
                </div>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => handleRenameFile(file, e)}
                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => handleDeleteFile(file.id, e)}
                    disabled={deleteFileMutation.isPending && deleteFileMutation.variables === file.id}
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {deleteFileMutation.isPending && deleteFileMutation.variables === file.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
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
            <AlertDialogCancel onClick={() => setConfirmOpen(false)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Renommer le fichier</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fileName">Nouveau nom</Label>
              <Input
                id="fileName"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="Entrez le nouveau nom du fichier"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    confirmRename();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsRenameOpen(false)}
            >
              Annuler
            </Button>
            <Button 
              type="button" 
              onClick={confirmRename}
              disabled={!newFileName.trim() || renameFileMutation.isPending}
            >
              {renameFileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Renommage...
                </>
              ) : (
                "Renommer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
