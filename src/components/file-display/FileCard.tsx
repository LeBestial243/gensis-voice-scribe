
import { FileType } from "@/hooks/useFiles";
import { Button } from "@/components/ui/button";
import { Download, Pencil, Trash2, Loader2, FileText, FileImage, FileArchive, FileVideo, File } from "lucide-react";
import { useState } from "react";
import { FilePreviewDialog } from "./FilePreviewDialog";

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
    if (type.includes('pdf')) {
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    if (type.includes('image')) {
      return <FileImage className="h-8 w-8 text-blue-500" />;
    }
    if (type.includes('zip') || type.includes('rar')) {
      return <FileArchive className="h-8 w-8 text-amber-500" />;
    }
    if (type.includes('document') || type.includes('word')) {
      return <FileText className="h-8 w-8 text-emerald-500" />;
    }
    if (type.includes('video')) {
      return <FileVideo className="h-8 w-8 text-purple-500" />;
    }
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <>
      <div 
        className="group bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
        onClick={() => setShowPreview(true)}
      >
        <div className="flex items-start space-x-4">
          {getFileIcon(file.type)}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{file.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {file.created_at}
            </p>
          </div>
          <div 
            className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onRename(file)}
              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => onDownload(file)}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onDelete(file.id)}
              disabled={isDeleting}
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
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
