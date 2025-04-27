
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Folder, FolderOpen, UploadCloud, ChevronDown } from "lucide-react";
import { FileDisplay } from '../FileDisplay';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface FolderCardProps {
  folder: {
    id: string;
    title: string;
    created_at: string;
  };
  fileCount: number;
  isActive: boolean;
  onToggle: () => void;
  onUploadClick: (folderId: string, event?: React.MouseEvent) => void;
}

export function FolderCard({ 
  folder, 
  fileCount, 
  isActive, 
  onToggle,
  onUploadClick 
}: FolderCardProps) {
  // Debug logs
  console.log(`FolderCard rendering: folder=${folder.id}, isActive=${isActive}, fileCount=${fileCount}`);
  
  const handleUploadClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    console.log("Upload clicked for folder:", folder.id);
    onUploadClick(folder.id, event);
  };

  // Calculer la hauteur max en fonction du nombre de fichiers
  const getMaxHeight = () => {
    if (fileCount === 0) return 'max-h-[100px]';
    if (fileCount <= 3) return 'max-h-[300px]';
    if (fileCount <= 5) return 'max-h-[400px]';
    return 'max-h-[500px]';
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 overflow-hidden",
        "hover:shadow-md",
        isActive ? "ring-2 ring-primary ring-offset-2" : "",
        isActive ? getMaxHeight() : "max-h-[100px]"
      )}
      onClick={onToggle}
      data-folder-id={folder.id}
      data-active={isActive}
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
        <CardContent className="animate-accordion-down overflow-auto">
          <div className="flex gap-2 my-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleUploadClick}
            >
              <UploadCloud className="h-4 w-4 mr-1" />
              Ajouter un fichier
            </Button>
          </div>
          
          <div className="mt-4 overflow-auto">
            {/* Only render FileDisplay if the folder is active */}
            <FileDisplay folderId={folder.id} />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
