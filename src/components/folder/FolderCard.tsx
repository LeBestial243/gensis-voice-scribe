
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Folder, FolderOpen, File, ChevronDown, UploadCloud } from "lucide-react";
import { FileDisplay } from "@/components/FileDisplay";
import { cn } from "@/lib/utils";

interface FolderCardProps {
  folder: {
    id: string;
    title: string;
    created_at?: string;
  };
  isActive: boolean;
  fileCount: number;
  onFolderClick: () => void;
  onUploadClick: (folderId: string, event?: React.MouseEvent) => void;
}

export function FolderCard({
  folder,
  isActive,
  fileCount,
  onFolderClick,
  onUploadClick,
}: FolderCardProps) {
  return (
    <Card 
      key={folder.id}
      className={cn(
        "cursor-pointer transition-all duration-200",
        "hover:shadow-md",
        isActive && "ring-2 ring-primary ring-offset-2"
      )}
      onClick={onFolderClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="relative">
              {isActive ? (
                <FolderOpen className="h-5 w-5 mr-2 text-primary" />
              ) : (
                <Folder className="h-5 w-5 mr-2 text-muted-foreground" />
              )}
              <ChevronDown 
                className={cn(
                  "h-3 w-3 absolute -bottom-1 -right-1 text-muted-foreground transition-transform duration-200",
                  isActive && "rotate-180"
                )}
              />
            </div>
            <CardTitle className="text-base">{folder.title}</CardTitle>
          </div>
          <Badge variant={isActive ? "default" : "outline"}>
            {fileCount} fichier{fileCount !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      
      {isActive && (
        <CardContent className="animate-accordion-down">
          <div className="flex gap-2 my-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => onUploadClick(folder.id, e)}
            >
              <UploadCloud className="h-4 w-4 mr-1" />
              Ajouter un fichier
            </Button>
          </div>
          
          <div className="mt-4">
            <FileDisplay folderId={folder.id} />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
