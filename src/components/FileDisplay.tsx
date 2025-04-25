
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";
import { useFileOperations, FileType } from "@/hooks/use-file-operations";
import { FileCard } from "./file-display/FileCard";
import { RenameDialog } from "./file-display/RenameDialog";

type FileDisplayProps = {
  folderId: string;
};

export function FileDisplay({ folderId }: FileDisplayProps) {
  const [fileToRename, setFileToRename] = useState<FileType | null>(null);
  const [newFileName, setNewFileName] = useState("");
  const [isRenameOpen, setIsRenameOpen] = useState(false);

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

  const { renameFileMutation, deleteFileMutation } = useFileOperations(folderId, refetch);

  const handleRenameFile = (file: FileType) => {
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
            <FileCard
              key={file.id}
              file={file}
              onRename={handleRenameFile}
              onDelete={(fileId) => deleteFileMutation.mutate(fileId)}
              isDeleting={deleteFileMutation.isPending && deleteFileMutation.variables === file.id}
            />
          ))}
        </div>
      </ScrollArea>

      <RenameDialog
        isOpen={isRenameOpen}
        onOpenChange={setIsRenameOpen}
        file={fileToRename}
        newFileName={newFileName}
        onNewFileNameChange={setNewFileName}
        onConfirm={confirmRename}
        isLoading={renameFileMutation.isPending}
      />
    </>
  );
}
