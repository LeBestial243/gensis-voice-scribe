
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, Edit, Trash, Copy, Download } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
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
import { NoteActionsMenu } from "./NoteActionsMenu";
import { CustomPagination } from "@/components/CustomPagination";
import { usePagination } from "@/hooks/usePagination";
import { notesService } from "@/services/notesService";
import { PaginationParams } from "@/types";

interface NotesListProps {
  profileId: string;
  searchQuery: string;
}

const PAGE_SIZE = 5; // Number of notes per page

export function NotesList({ profileId, searchQuery }: NotesListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['notes', profileId, searchQuery, currentPage, PAGE_SIZE],
    queryFn: async () => {
      try {
        return await notesService.getNotes(profileId, searchQuery, { 
          page: currentPage, 
          pageSize: PAGE_SIZE 
        });
      } catch (error) {
        console.error("Error fetching notes:", error);
        return { notes: [], totalCount: 0 };
      }
    },
  });

  const notes = data?.notes || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const deleteNote = useMutation({
    mutationFn: notesService.deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', profileId] });
      toast({
        title: "Note supprimée",
        description: "La note a été supprimée avec succès."
      });
      setDeleteConfirmOpen(false);
      setNoteToDelete(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la note.",
        variant: "destructive"
      });
    }
  });

  const toggleExpand = (id: string) => {
    setExpandedItem(expandedItem === id ? null : id);
  };

  const confirmDelete = (id: string) => {
    setNoteToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = () => {
    if (noteToDelete) {
      deleteNote.mutate(noteToDelete);
    }
  };

  const handleCopy = (content: string | null) => {
    if (!content) return;
    
    navigator.clipboard.writeText(content)
      .then(() => {
        toast({
          title: "Copié !",
          description: "Le contenu a été copié dans le presse-papier."
        });
      })
      .catch(() => {
        toast({
          title: "Erreur",
          description: "Impossible de copier le contenu.",
          variant: "destructive"
        });
      });
  };

  const handleExport = (note: any) => {
    if (!note.content) return;
    
    const blob = new Blob([note.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exporté !",
      description: "La note a été exportée en fichier texte."
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="pt-6 flex flex-col items-center justify-center text-center h-40">
          <FileText className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Aucune note trouvée</p>
          {searchQuery && (
            <p className="text-sm text-muted-foreground">Aucun résultat pour "{searchQuery}"</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <ScrollArea className="max-h-[600px]">
        <div className="space-y-3 pr-4">
          {notes.map((note) => (
            <Card key={note.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{note.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      {note.created_at && formatDistanceToNow(parseISO(note.created_at), { 
                        addSuffix: true, 
                        locale: fr 
                      })}
                    </CardDescription>
                  </div>
                  <NoteActionsMenu note={note} />
                </div>
              </CardHeader>
              <CardContent>
                <p className={`text-sm ${expandedItem === note.id ? '' : 'line-clamp-3'}`}>
                  {note.content || "Aucun contenu disponible"}
                </p>
                {note.content && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-xs h-auto p-0 mt-1"
                    onClick={() => toggleExpand(note.id)}
                  >
                    {expandedItem === note.id ? "Voir moins" : "Voir plus"}
                  </Button>
                )}
              </CardContent>
              <CardFooter className="border-t bg-muted/30 py-2 px-6">
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8"
                    onClick={() => handleCopy(note.content)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copier
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8"
                    onClick={() => handleExport(note)}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Exporter
                  </Button>
                  <Button size="sm" variant="outline" className="h-8">
                    <Edit className="h-3 w-3 mr-1" />
                    Modifier
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 text-destructive"
                    onClick={() => confirmDelete(note.id)}
                  >
                    <Trash className="h-3 w-3 mr-1" />
                    Supprimer
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {totalPages > 1 && (
        <CustomPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          className="mt-4"
        />
      )}

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cette note ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La note sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
