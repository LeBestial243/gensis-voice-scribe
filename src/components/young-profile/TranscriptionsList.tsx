
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, Edit, Download, Trash2, Play, FileAudio } from "lucide-react";

interface TranscriptionsListProps {
  profileId: string;
  searchQuery: string;
  selectedFolderId: string | null;
}

export function TranscriptionsList({ profileId, searchQuery, selectedFolderId }: TranscriptionsListProps) {
  // Récupérer les fichiers du profil
  const { data: files = [], isLoading } = useQuery({
    queryKey: ['files', profileId, selectedFolderId],
    queryFn: async () => {
      let query = supabase
        .from('files')
        .select('*, folders(id, title)')
        .order('created_at', { ascending: false });
      
      if (selectedFolderId) {
        query = query.eq('folder_id', selectedFolderId);
      } else {
        // Si aucun dossier n'est sélectionné, récupérer tous les fichiers des dossiers de ce profil
        const { data: folders } = await supabase
          .from('folders')
          .select('id')
          .eq('profile_id', profileId);
        
        if (folders && folders.length > 0) {
          const folderIds = folders.map(folder => folder.id);
          query = query.in('folder_id', folderIds);
        }
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
  });

  // Filtrer les fichiers en fonction de la recherche
  const filteredFiles = files.filter(file => {
    const nameMatch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    // Si nous avions accès au contenu transcrit, nous pourrions aussi filtrer sur celui-ci
    return nameMatch;
  });

  // Détecter le type de document (signalement, observation, etc.)
  const getFileType = (fileName: string) => {
    const lowerName = fileName.toLowerCase();
    if (lowerName.includes('signalement')) return 'signalement';
    if (lowerName.includes('observation')) return 'observation';
    if (lowerName.includes('entretien')) return 'entretien';
    if (lowerName.includes('réunion')) return 'réunion';
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Transcriptions</h2>
        <Badge variant="outline">{filteredFiles.length} fichier(s)</Badge>
      </div>
      
      {filteredFiles.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center h-40">
            <FileText className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Aucune transcription disponible</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "Essayez une autre recherche" : "Commencez par enregistrer une transcription"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredFiles.map((file) => {
            const fileType = getFileType(file.name);
            const folderTitle = file.folders?.title || 'Dossier inconnu';
            
            return (
              <Card key={file.id} className="overflow-hidden hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{file.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(file.created_at || '').toLocaleDateString('fr-FR')}</span>
                        <span className="mx-1">•</span>
                        <span>{folderTitle}</span>
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      {file.type === 'audio' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm line-clamp-2">
                    {/* Contenu de la transcription - Pour l'instant fictif */}
                    {file.name === 'Entretien avec Théo' ? 
                      "Pendant l'entretien, Théo a évoqué son envie de poursuivre une formation en cuisine. Il semble plus motivé et impliqué dans son projet professionnel." : 
                      "Contenu de la transcription non disponible. Cliquez pour voir le contenu complet."}
                  </p>
                </CardContent>
                <CardFooter className="border-t bg-muted/20 py-2 px-6">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {file.type === 'audio' && (
                        <Badge variant="outline" className="flex items-center gap-1 text-xs">
                          <FileAudio className="h-3 w-3" />
                          <span>Audio</span>
                        </Badge>
                      )}
                      {fileType && (
                        <Badge 
                          variant={fileType === 'signalement' ? 'destructive' : 'secondary'} 
                          className="text-xs"
                        >
                          {fileType.charAt(0).toUpperCase() + fileType.slice(1)}
                        </Badge>
                      )}
                    </div>
                    <Button variant="link" size="sm" className="text-xs h-auto p-0">
                      Voir le document
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
