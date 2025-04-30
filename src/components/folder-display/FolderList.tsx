
import { FolderCard } from "../young-profile/FolderCard";

interface Folder {
  id: string;
  title: string;
}

interface FolderListProps {
  folders: Folder[];
  folderCounts: Record<string, number>;
  activeFolderId: string | null;
  onFolderSelect: (folderId: string) => void;
  onUploadClick: (folderId: string, event?: React.MouseEvent) => void;
  onDeleteFolder: (folderId: string) => void;
}

export function FolderList({ 
  folders, 
  folderCounts, 
  activeFolderId, 
  onFolderSelect,
  onUploadClick,
  onDeleteFolder
}: FolderListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {folders.map((folder) => {
        const isActive = folder.id === activeFolderId;
        console.log(`Rendering folder ${folder.id} with isActive=${isActive}`);
        return (
          <FolderCard
            key={folder.id}
            folder={folder}
            fileCount={folderCounts[folder.id] || 0}
            isActive={isActive}
            onToggle={() => onFolderSelect(folder.id)}
            onUploadClick={onUploadClick}
            onDeleteFolder={onDeleteFolder}
          />
        );
      })}
    </div>
  );
}
