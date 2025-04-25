
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
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

