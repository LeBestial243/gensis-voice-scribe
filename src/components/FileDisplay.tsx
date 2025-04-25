import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  File, 
  FileImage, 
  FileText, 
  FilePdf,
  FileArchive,
  Download,
  Trash2, 
  Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFileStorage } from "@/hooks/use-files-storage";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
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

type FileType = {
  id: string;
  name: string;
  type: string;
  size: number;
  created_at: string;
  path: string;
};

export function FileDisplay({ folderId }: FileDisplayProps) {
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { deleteFile } = useFileStorage(folderId);

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

  const handleDeleteFile = (fileId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setFileToDelete(fileId);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (fileToDelete) {
      deleteFile.mutate(fileToDelete, {
        onSuccess: () => {
          setTimeout(() => refetch(), 500);
        }
      });
      setConfirmOpen(false);
      setFileToDelete(null);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) {
      return <FilePdf className="h-8 w-8 text-red-500" />;
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-md">
            <div className="flex items-start space-x-4">
              <Skeleton className="h-10 w-10 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
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
                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => handleDeleteFile(file.id, e)}
                    disabled={deleteFile.isPending && deleteFile.variables === file.id}
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {deleteFile.isPending && deleteFile.variables === file.id ? (
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
    </>
  );
}
