
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Folder {
  id: string;
  title: string;
}

interface FolderSelectorProps {
  folders: Folder[];
  selectedFolderId: string;
  onFolderSelect: (folderId: string) => void;
}

export function FolderSelector({
  folders,
  selectedFolderId,
  onFolderSelect,
}: FolderSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Sélectionner un dossier</label>
      <Select value={selectedFolderId} onValueChange={onFolderSelect}>
        <SelectTrigger>
          <SelectValue placeholder="Choisir un dossier" />
        </SelectTrigger>
        <SelectContent>
          {folders.map((folder) => (
            <SelectItem key={folder.id} value={folder.id}>
              {folder.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
