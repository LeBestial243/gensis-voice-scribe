
import { FileType } from "@/hooks/useFiles";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Loader2 } from "lucide-react";
import { useState } from "react";
import { FilePreviewDialog } from "./FilePreviewDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";

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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle click on the card to prevent propagation to parent
  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop event from bubbling up to parent folder
    setShowPreview(true);
  };

  // Ensure deletion doesn't cause event propagation issues
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(file.id);
  };

  return (
    <>
      <Card 
        className="group relative cursor-pointer hover:shadow-md transition-shadow duration-200"
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-medium text-gray-900">
              {file.name}
            </h3>
          </div>
            
          <div className="flex items-center mt-6">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                {getInitials(file.author || "Felly Lunkeba")}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground ml-2">
              {file.author || "Felly Lunkeba"}
            </span>
          </div>
        </CardContent>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              onDownload(file);
            }}>
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                "Télécharger"
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              onRename(file);
            }}>
              Renommer
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={handleDelete}
            >
              {isDeleting ? 
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 
                "Supprimer"
              }
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Card>

      <FilePreviewDialog
        file={file}
        open={showPreview}
        onOpenChange={setShowPreview}
      />
    </>
  );
}
