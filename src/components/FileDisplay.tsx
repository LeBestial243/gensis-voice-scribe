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
    console.log("Delete click for file:", fileId);
    setFileToDelete(fileId);
  };

  const handleRenameClick = (file: FileType) => {
    setFileToRename(file);
    setNewFileName(file.name);
  };

  const confirmDelete = () => {
    console.log("Confirming delete for file:", fileToDelete);
    if (fileToDelete) {
      deleteFile(fileToDelete);
      // Keep the dialog open until the deletion is complete
      // It will be closed automatically by the onSettled callback in the mutation
    }
  };

  const cancelDelete = () => {
    if (!isDeleting) {
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
      <div className="flex justify-center items-center h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] p-6 text-center border border-border/30 rounded-xl bg-background">
        <FileText className="h-10 w-10 text-muted-foreground mb-3 opacity-40" />
        <p className="text-sm text-muted-foreground">
          Aucun fichier dans ce dossier
        </p>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="h-auto max-h-[500px] w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
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
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
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
