
import { Card, CardContent } from "@/components/ui/card";
import { Folder } from "lucide-react";
import { FolderCard } from "./FolderCard";

interface FolderGridProps {
  folders: Array<{
    id: string;
    title: string;
    created_at?: string;
  }>;
  activeFolderId: string | null;
  folderCounts: Record<string, number>;
  onFolderSelect: (folderId: string) => void;
  onUploadClick: (folderId: string, event?: React.MouseEvent) => void;
}

export function FolderGrid({
  folders,
  activeFolderId,
  folderCounts,
  onFolderSelect,
  onUploadClick,
}: FolderGridProps) {
  if (folders.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="pt-6 flex flex-col items-center justify-center text-center h-40">
          <Folder className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Aucun dossier trouvé</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {folders.map((folder) => (
        <FolderCard
          key={folder.id}
          folder={folder}
          isActive={folder.id === activeFolderId}
          fileCount={folderCounts[folder.id] || 0}
          onFolderClick={() => onFolderSelect(folder.id)}
          onUploadClick={onUploadClick}
        />
      ))}
    </div>
  );
}
