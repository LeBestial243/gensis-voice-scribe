
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
  
  const relevantFiles = allFiles.filter(file => 
    file.type === 'transcription' || 
    file.type === 'text' || 
    file.type === 'text/plain' ||
    (file.name && file.name.toLowerCase().includes('transcription'))
  );
  
  console.log("FolderFileList: Displaying", allFiles.length, "files, including", relevantFiles.length, "transcriptions");

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
        const isRelevant = relevantFiles.includes(file);
        const isSelected = selectedFiles.includes(file.id);
        
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
              />
            )}
            <FileText className={`h-4 w-4 flex-shrink-0 ${isRelevant ? 'text-purple-400' : 'text-gray-400'}`} />
            <span className="text-sm text-gray-600 truncate">{file.name}</span>
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
