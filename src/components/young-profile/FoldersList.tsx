
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Folder, Plus } from "lucide-react";

interface FoldersListProps {
  profileId: string;
  searchQuery: string;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
}

export function FoldersList({ 
  profileId, 
  searchQuery, 
  selectedFolderId, 
  onSelectFolder 
}: FoldersListProps) {
  // Récupérer les dossiers du profil
  const { data: folders = [], isLoading } = useQuery({
    queryKey: ['folders', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Récupérer le nombre de fichiers par dossier
  const { data: fileCountsByFolder = {} } = useQuery({
    queryKey: ['file_counts', profileId],
    queryFn: async () => {
      const folderIds = folders.map(folder => folder.id);
      
      if (folderIds.length === 0) return {};
      
      const { data, error } = await supabase
        .from('files')
        .select('folder_id, count')
        .in('folder_id', folderIds)
        .order('folder_id')
        .group('folder_id');
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach(item => {
        counts[item.folder_id] = item.count;
      });
      
      return counts;
    },
    enabled: folders.length > 0,
  });

  // Filtrer les dossiers en fonction de la recherche
  const filteredFolders = folders.filter(folder =>
    folder.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <h2 className="text-xl font-bold">Dossiers</h2>
        <Button size="sm" className="flex items-center gap-1">
          <Plus className="h-4 w-4" /> Nouveau dossier
        </Button>
      </div>
      
      {filteredFolders.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center h-40">
            <Folder className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Aucun dossier disponible</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "Essayez une autre recherche" : "Créez votre premier dossier"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card 
            className={`hover:bg-accent/50 transition-all duration-300 cursor-pointer ${
              selectedFolderId === null ? 'bg-accent' : ''
            }`}
            onClick={() => onSelectFolder(null)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">
                Tous les dossiers
              </CardTitle>
              <Badge variant="secondary">
                {Object.values(fileCountsByFolder).reduce((sum, count) => sum + (count || 0), 0)} fichiers
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Afficher tous les fichiers de tous les dossiers
              </p>
            </CardContent>
          </Card>
          
          {filteredFolders.map((folder) => (
            <Card 
              key={folder.id} 
              className={`hover:bg-accent/50 transition-all duration-300 cursor-pointer ${
                selectedFolderId === folder.id ? 'bg-accent' : ''
              }`}
              onClick={() => onSelectFolder(folder.id)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                  {folder.title}
                </CardTitle>
                <Badge variant="secondary">
                  {fileCountsByFolder[folder.id] || 0} fichiers
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Créé le {new Date(folder.created_at || '').toLocaleDateString('fr-FR')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
