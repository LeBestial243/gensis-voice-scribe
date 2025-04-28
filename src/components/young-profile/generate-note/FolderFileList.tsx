
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FileType } from "@/types/files";

interface FolderFileListProps {
  files: FileType[];
}

export function FolderFileList({ files }: FolderFileListProps) {
  // On veut afficher tous les fichiers, pas seulement les transcriptions
  // mais on peut les mettre en évidence
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
        
        return (
          <div 
            key={file.id} 
            className={`flex items-center gap-2 p-2 rounded-md ${isRelevant ? 'bg-purple-50 border border-purple-100' : 'bg-gray-50 border border-gray-100'}`}
          >
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
