
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { FileType } from "@/types/files";

interface FolderFileListProps {
  files: FileType[];
  selectedFiles?: string[];
  onFileSelect?: (fileId: string) => void;
}

export function FolderFileList({ 
  files, 
  selectedFiles = [], 
  onFileSelect 
}: FolderFileListProps) {
  const allFiles = files || [];
  
  // Identifier les fichiers pertinents (transcriptions)
  const relevantFiles = allFiles.filter(file => 
    file.type === 'transcription' || 
    file.type === 'text' || 
    file.type === 'text/plain' ||
    (file.name && file.name.toLowerCase().includes('transcription'))
  );
  
  console.log("FolderFileList: Displaying", allFiles.length, "files, including", relevantFiles.length, "transcriptions");
  console.log("FolderFileList: Files data", allFiles.map(file => ({ id: file.id, name: file.name, type: file.type })));

  if (allFiles.length === 0) {
    return (
      <div className="p-2 text-xs text-gray-500 italic">
        Aucun fichier dans ce dossier
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {allFiles.map(file => {
        const isRelevant = relevantFiles.some(relevantFile => relevantFile.id === file.id);
        const isSelected = selectedFiles.includes(file.id);
        
        console.log(`File ${file.name}:`, { id: file.id, isRelevant, isSelected });
        
        return (
          <div 
            key={file.id} 
            className={`flex items-center gap-2 p-2 rounded-md ${
              isRelevant ? 'bg-purple-50 border border-purple-100' : 'bg-gray-50 border border-gray-100'
            } ${isSelected ? 'ring-2 ring-purple-200' : ''}`}
          >
            {onFileSelect && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onFileSelect(file.id)}
                className="mr-1"
                id={`file-checkbox-${file.id}`}
              />
            )}
            <FileText className={`h-4 w-4 flex-shrink-0 ${isRelevant ? 'text-purple-400' : 'text-gray-400'}`} />
            <label 
              htmlFor={`file-checkbox-${file.id}`}
              className="text-sm text-gray-600 truncate cursor-pointer flex-grow"
            >
              {file.name}
            </label>
            <Badge variant={isRelevant ? "secondary" : "outline"} className="text-xs ml-auto">
              {file.type === 'transcription' 
                ? 'Transcription' 
                : file.type === 'text' || file.type === 'text/plain'
                  ? 'Texte'
                  : file.type}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
