
import { useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, MoreVertical, Download, Trash, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MorphCard } from "@/components/ui/MorphCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CardContent, CardHeader } from "@/components/ui/card";
import type { FileData } from "@/types/files";

interface TranscriptionCardProps {
  file: FileData;
  onDelete: (id: string) => Promise<void>;
  onDownload: (file: FileData) => Promise<void>;
}

export function TranscriptionCard({ file, onDelete, onDownload }: TranscriptionCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  const getFormattedDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true, locale: fr });
    } catch (error) {
      return dateString;
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <MorphCard interactive onClick={() => setIsViewDialogOpen(true)}>
        <CardHeader className="flex flex-row items-start justify-between p-4 pb-0">
          <div className="flex items-start gap-3 overflow-hidden">
            <div className="p-2 rounded-lg bg-gensys-primary-from/10 text-gensys-primary-from">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              {/* Using break-words to allow long words to break and continue on next line */}
              <h3 className="font-medium text-gray-800 dark:text-gray-200 break-words">
                {file.name}
              </h3>
              <div className="flex items-center mt-1 text-xs text-gray-500">
                <span>{getFormattedDate(file.created_at)}</span>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsViewDialogOpen(true);
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                Voir
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(file);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteDialogOpen(true);
                }}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <Trash className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        
        <CardContent className="p-4 pt-2">
          {file.content && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {file.content}
            </p>
          )}
          <div className="flex justify-end items-center mt-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-gensys-primary-to/10 text-gensys-primary-to">
                {getInitials(file.author || "Utilisateur")}
              </AvatarFallback>
            </Avatar>
          </div>
        </CardContent>
      </MorphCard>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ce fichier ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le fichier sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                await onDelete(file.id);
                setIsDeleteDialogOpen(false);
              }}
              className="bg-destructive text-destructive-foreground"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Content display dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              <div className="break-words max-w-full pr-12">{file.name}</div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="max-h-[calc(80vh-120px)]">
              <div className="p-4 text-sm">
                {file.content || "Aucun contenu disponible"}
              </div>
            </ScrollArea>
          </div>
          
          <div className="pt-4 border-t flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {getFormattedDate(file.created_at)}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsViewDialogOpen(false)}
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
