
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type FileListProps = {
  folderId: string;
};

export function FileList({ folderId }: FileListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: files = [] } = useQuery({
    queryKey: ['files', folderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('folder_id', folderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      // Get the file info first to get the path
      const { data: fileData } = await supabase
        .from('files')
        .select('path')
        .eq('id', fileId)
        .single();

      if (!fileData) throw new Error('File not found');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove([fileData.path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;
      
      return fileId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', folderId] });
      toast({ title: "Fichier supprimé avec succès" });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({
        title: "Erreur lors de la suppression du fichier",
        variant: "destructive",
      });
    },
  });

  const handleDeleteFile = (fileId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce fichier ?")) {
      deleteFileMutation.mutate(fileId);
    }
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

  return (
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
              <TableCell>{file.name}</TableCell>
              <TableCell>{file.type}</TableCell>
              <TableCell>{formatSize(file.size)}</TableCell>
              <TableCell>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleDeleteFile(file.id)}
                  disabled={deleteFileMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
