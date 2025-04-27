
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getErrorStyleClass } from "@/utils/transcription-utils";

interface Folder {
  id: string;
  title: string;
}

interface FolderSelectorProps {
  folders: Folder[];
  selectedFolderId: string;
  onFolderSelect: (folderId: string) => void;
  hasError?: boolean;
}

export function FolderSelector({
  folders,
  selectedFolderId,
  onFolderSelect,
  hasError = false
}: FolderSelectorProps) {
  return (
    <div className="space-y-2">
      <label className={`text-sm font-medium ${hasError ? 'text-red-600' : ''}`}>
        Sélectionner un dossier
      </label>
      <Select value={selectedFolderId} onValueChange={onFolderSelect}>
        <SelectTrigger className={getErrorStyleClass(hasError)}>
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
