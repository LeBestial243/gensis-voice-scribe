
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FileType } from "@/types/files";

interface FolderFileListProps {
  files: FileType[];
}

export function FolderFileList({ files }: FolderFileListProps) {
  const relevantFiles = files.filter(file => 
    file.type === 'transcription' || 
    file.type === 'text' || 
    file.type === 'text/plain' ||
    file.name.toLowerCase().includes('transcription')
  );

  if (relevantFiles.length === 0) {
    return (
      <div className="p-2 text-xs text-gray-500 italic">
        Aucune transcription dans ce dossier
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {relevantFiles.map(file => (
        <div 
          key={file.id} 
          className="flex items-center gap-2 p-2 rounded-md bg-gray-50 border border-gray-100"
        >
          <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-600 truncate">{file.name}</span>
          <Badge variant="outline" className="text-xs ml-auto">
            {file.type === 'transcription' ? 'Transcription' : 'Document'}
          </Badge>
        </div>
      ))}
    </div>
  );
}
