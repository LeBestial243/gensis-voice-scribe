
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileEdit, Clock, Edit, Download, Copy, Trash2 } from "lucide-react";

interface NotesListProps {
  profileId: string;
  searchQuery: string;
}

export function NotesList({ profileId, searchQuery }: NotesListProps) {
  // Récupérer les notes du profil
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Filtrer les notes en fonction de la recherche
  const filteredNotes = notes.filter(note => {
    const titleMatch = note.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const contentMatch = note.content?.toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || contentMatch;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Si aucune note n'existe, afficher des données de démonstration
  const demoNotes = [
    {
      id: '1',
      title: 'Bilan semestriel',
      content: 'Durant ce semestre, l\'évolution a été très positive. Points forts: amélioration dans la socialisation et l\'autonomie. Points à travailler: gestion de la frustration.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Synthèse parcours scolaire',
      content: 'Progression constante en mathématiques. Difficultés persistantes en expression écrite. Recommandation: mise en place d\'un soutien individuel en français.',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ];

  const displayNotes = filteredNotes.length > 0 ? filteredNotes : demoNotes;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Notes IA</h2>
        <Badge variant="outline">{displayNotes.length} note(s)</Badge>
      </div>
      
      {displayNotes.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center h-40">
            <FileEdit className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Aucune note disponible</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "Essayez une autre recherche" : "Générez votre première note avec l'IA"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayNotes.map((note) => (
            <Card key={note.id} className="overflow-hidden hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{note.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(note.created_at).toLocaleDateString('fr-FR')}</span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Modifier">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Copier">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Télécharger">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Supprimer">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm line-clamp-3">{note.content}</p>
              </CardContent>
              <CardFooter className="border-t bg-muted/20 py-2 px-6">
                <div className="flex items-center justify-between w-full">
                  <Badge variant="outline" className="text-xs">
                    Généré par IA
                  </Badge>
                  <Button variant="link" size="sm" className="text-xs h-auto p-0">
                    Voir la note complète
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
