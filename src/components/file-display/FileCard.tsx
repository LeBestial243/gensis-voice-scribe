
import { FileType } from "@/hooks/useFiles";
import { Button } from "@/components/ui/button";
import { Download, Pencil, Trash2, Loader2, File } from "lucide-react";
import { useState } from "react";
import { FilePreviewDialog } from "./FilePreviewDialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface FileCardProps {
  file: FileType;
  isDownloading: boolean;
  isDeleting: boolean;
  onDownload: (file: FileType) => void;
  onDelete: (fileId: string) => void;
  onRename: (file: FileType) => void;
}

export function FileCard({
  file,
  isDownloading,
  isDeleting,
  onDownload,
  onDelete,
  onRename,
}: FileCardProps) {
  const [showPreview, setShowPreview] = useState(false);

  // Format file size to B, KB, etc.
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Format date: "26 avril 2025 à 00:58"
  const formattedDate = format(new Date(file.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr });
  
  // Get day, month, year from date
  const day = format(new Date(file.created_at), "d", { locale: fr });
  const month = format(new Date(file.created_at), "MMMM", { locale: fr });
  const year = format(new Date(file.created_at), "yyyy", { locale: fr });
  const time = format(new Date(file.created_at), "HH:mm", { locale: fr });

  return (
    <>
      <div 
        className="group text-center p-3 cursor-pointer" 
        onClick={() => setShowPreview(true)}
      >
        <div className="flex flex-col items-center">
          <File className="h-12 w-12 text-gray-400 mb-2" />
          
          <div className="text-center mt-2">
            <HoverCard>
              <HoverCardTrigger asChild>
                <p className="text-sm font-medium truncate w-24">{file.name}</p>
              </HoverCardTrigger>
              <HoverCardContent side="top" className="w-[260px] text-sm">
                {file.name}
              </HoverCardContent>
            </HoverCard>
            
            <div className="text-xs text-muted-foreground mt-1 space-y-1">
              <p>
                {day} {month} {year}
                <br />
                à {time}
              </p>
              <p>{formatFileSize(file.size)}</p>
            </div>
          </div>
        </div>
        
        <div className="mt-2 flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDownload(file);
            }}
            disabled={isDownloading}
            className="h-8 w-8 p-0"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRename(file);
            }}
            className="h-8 w-8 p-0"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(file.id);
            }}
            disabled={isDeleting}
            className="h-8 w-8 p-0 text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <FilePreviewDialog
        file={file}
        open={showPreview}
        onOpenChange={setShowPreview}
      />
    </>
  );
}
