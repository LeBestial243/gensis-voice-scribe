
import { FileType } from "@/hooks/useFiles";
import { Button } from "@/components/ui/button";
import {
  Download,
  Pencil,
  Trash2,
  Loader2,
  FileText,
  FileImage,
  FileArchive,
  FileVideo,
  File,
} from "lucide-react";
import { useState } from "react";
import { FilePreviewDialog } from "./FilePreviewDialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

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

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) {
      return <FileText className="h-10 w-10 text-red-500" />;
    }
    if (type.includes("image")) {
      return <FileImage className="h-10 w-10 text-blue-500" />;
    }
    if (type.includes("zip") || type.includes("rar")) {
      return <FileArchive className="h-10 w-10 text-amber-500" />;
    }
    if (type.includes("video")) {
      return <FileVideo className="h-10 w-10 text-purple-500" />;
    }
    return <File className="h-10 w-10 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formattedDate = format(new Date(file.created_at), "d MMMM yyyy 'à' HH:mm", {
    locale: fr,
  });

  return (
    <>
      <div 
        className="group bg-white rounded-xl p-4 border border-border/50 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer"
        onClick={() => setShowPreview(true)}
      >
        <div className="relative flex items-start space-x-4">
          <div className="flex-shrink-0">
            {getFileIcon(file.type)}
          </div>
          <div className="flex-1 min-w-0">
            <HoverCard>
              <HoverCardTrigger asChild>
                <h3 className="font-medium text-sm truncate">
                  {file.name}
                </h3>
              </HoverCardTrigger>
              <HoverCardContent side="top" className="w-[260px] text-sm">
                {file.name}
              </HoverCardContent>
            </HoverCard>
            <div className="flex flex-col mt-1 gap-1">
              <p className="text-xs text-muted-foreground">
                {formattedDate}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRename(file);
            }}
            className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDownload(file);
            }}
            disabled={isDownloading}
            className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
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
              onDelete(file.id);
            }}
            disabled={isDeleting}
            className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
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
