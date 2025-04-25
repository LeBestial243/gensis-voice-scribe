
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileText } from "lucide-react";
import { FileCard } from "./file-display/FileCard";
import { DeleteDialog } from "./file-display/DeleteDialog";
import { RenameDialog } from "./file-display/RenameDialog";
import { useFiles, FileType } from "@/hooks/useFiles";

interface FileDisplayProps {
  folderId: string;
}

export function FileDisplay({ folderId }: FileDisplayProps) {
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [fileToRename, setFileToRename] = useState<FileType | null>(null);
  const [newFileName, setNewFileName] = useState("");

  const {
    files,
    isLoading,
    isDownloading,
    handleDownload,
    deleteFile,
    isDeleting,
    renameFile,
    isRenaming,
  } = useFiles(folderId);

  const handleDeleteClick = (fileId: string) => {
    setFileToDelete(fileId);
  };

  const handleRenameClick = (file: FileType) => {
    setFileToRename(file);
    setNewFileName(file.name);
  };

  const confirmDelete = () => {
    if (fileToDelete) {
      deleteFile(fileToDelete);
      setFileToDelete(null);
    }
  };

  const confirmRename = () => {
    if (fileToRename && newFileName.trim()) {
      renameFile({ fileId: fileToRename.id, newName: newFileName.trim() });
      setFileToRename(null);
      setNewFileName("");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] p-8 text-center border-2 border-dashed border-muted rounded-xl bg-muted/5">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          Aucun fichier
        </h3>
        <p className="text-sm text-muted-foreground">
          Glissez et déposez des fichiers ici ou utilisez le bouton d'ajout
        </p>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="h-[600px] w-full pr-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {files.map((file: FileType) => (
            <FileCard
              key={file.id}
              file={file}
              isDownloading={isDownloading === file.id}
              isDeleting={isDeleting}
              onDownload={handleDownload}
              onDelete={handleDeleteClick}
              onRename={handleRenameClick}
            />
          ))}
        </div>
      </ScrollArea>

      <DeleteDialog
        isOpen={fileToDelete !== null}
        onClose={() => setFileToDelete(null)}
        onConfirm={confirmDelete}
      />

      <RenameDialog
        isOpen={fileToRename !== null}
        onClose={() => setFileToRename(null)}
        onConfirm={confirmRename}
        newFileName={newFileName}
        onNewFileNameChange={setNewFileName}
        isRenaming={isRenaming}
      />
    </>
  );
}
