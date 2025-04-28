
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Folder, FolderOpen, UploadCloud, ChevronDown, Trash2, MoreVertical } from "lucide-react";
import { FileDisplay } from '../FileDisplay';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  onDeleteFolder?: (folderId: string) => void;
}

export function FolderCard({ 
  folder, 
  fileCount, 
  isActive, 
  onToggle,
  onUploadClick,
  onDeleteFolder
}: FolderCardProps) {
  // Debug logs
  console.log(`FolderCard rendering: folder=${folder.id}, isActive=${isActive}, fileCount=${fileCount}`);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleUploadClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    console.log("Upload clicked for folder:", folder.id);
    onUploadClick(folder.id, event);
  };

  const handleDeleteClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (onDeleteFolder) {
      onDeleteFolder(folder.id);
    }
    setDeleteDialogOpen(false);
  };

  // Calculer la hauteur max en fonction du nombre de fichiers
  const getMaxHeight = () => {
    if (fileCount === 0) return 'max-h-[100px]';
    if (fileCount <= 3) return 'max-h-[300px]';
    if (fileCount <= 5) return 'max-h-[400px]';
    return 'max-h-[500px]';
  };

  return (
    <>
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-200 overflow-hidden",
          "hover:shadow-md",
          isActive ? "ring-2 ring-gensys-primary-to ring-offset-2" : "",
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
                  <FolderOpen className="h-5 w-5 mr-2 text-gensys-primary-to" />
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
            <div className="flex items-center gap-2">
              <Badge variant={isActive ? "default" : "outline"}>
                {fileCount} fichier{fileCount !== 1 ? 's' : ''}
              </Badge>
              
              {/* Menu d'actions du dossier */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(e);
                    }}
                    className="text-red-600 focus:text-red-600 focus:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        {isActive && (
          <CardContent className="animate-accordion-down overflow-auto">
            <div className="flex gap-2 my-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleUploadClick}
                className="border-gensys-primary-via hover:border-gensys-primary-to hover:bg-gensys-primary-to/5"
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

      {/* Dialogue de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ce dossier ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le dossier "{folder.title}" et tous ses fichiers seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
