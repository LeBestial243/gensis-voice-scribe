import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FolderDialog } from "@/components/FolderDialog";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, FolderOpen, File, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MorphCard } from "@/components/ui/MorphCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface FoldersListProps {
  profileId: string;
  searchQuery: string;
  onFolderSelect: (folderId: string | null) => void;
  selectedFolderId: string | null;
}

export function FoldersList({ 
  profileId, 
  searchQuery, 
  onFolderSelect,
  selectedFolderId 
}: FoldersListProps) {
  const { 
    data: folders = [], 
    isLoading: foldersLoading, 
    error: foldersError 
  } = useQuery({
    queryKey: ['folders', profileId],
    queryFn: async () => {
      console.log('Fetching folders for profile ID:', profileId);
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('profile_id', profileId)
        .order('title', { ascending: true });

      if (error) {
        console.error('Error fetching folders:', error);
        throw new Error(`Erreur lors du chargement des dossiers: ${error.message}`);
      }
      
      console.log('Folders data:', data);
      return data || [];
    },
  });

  const { 
    data: foldersCounts = {}, 
    error: countsError 
  } = useQuery({
    queryKey: ['folders_file_count', profileId, folders],
    queryFn: async () => {
      const folderIds = folders.map(folder => folder.id);
      
      if (folderIds.length === 0) return {};
      
      console.log('Fetching file counts for folders:', folderIds);
      const { data, error } = await supabase
        .from('files')
        .select('folder_id')
        .in('folder_id', folderIds);
      
      if (error) {
        console.error('Error fetching file counts:', error);
        throw new Error(`Erreur lors du comptage des fichiers: ${error.message}`);
      }
      
      const counts: Record<string, number> = {};
      
      for (const folder of folderIds) {
        const filesInFolder = data?.filter(file => file.folder_id === folder) || [];
        counts[folder] = filesInFolder.length;
      }
      
      console.log('Folder counts:', counts);
      return counts;
    },
    enabled: folders.length > 0,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const filteredFolders = folders.filter(folder => {
    if (!searchQuery) return true;
    return folder.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const hasError = foldersError || countsError;
  const errorMessage = foldersError 
    ? (foldersError instanceof Error ? foldersError.message : 'Erreur lors du chargement des dossiers')
    : countsError 
      ? (countsError instanceof Error ? countsError.message : 'Erreur lors du comptage des fichiers')
      : null;

  if (foldersLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <LoadingSpinner size="sm" />
        <p className="mt-4 text-sm text-muted-foreground">Chargement des dossiers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Dossiers</h2>
        <FolderDialog profileId={profileId} />
      </div>
      
      <Button 
        variant={selectedFolderId === null ? "secondary" : "outline"} 
        className="w-full justify-start mb-2"
        onClick={() => onFolderSelect(null)}
      >
        <Folder className="h-4 w-4 mr-2" />
        Tous les dossiers
      </Button>
      
      <ScrollArea className="max-h-[500px]">
        {filteredFolders.length === 0 ? (
          <MorphCard className="bg-muted/50">
            <CardContent className="pt-6 flex flex-col items-center justify-center text-center h-40">
              <Folder className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Aucun dossier trouvé</p>
              {searchQuery && (
                <p className="text-sm text-muted-foreground">Aucun résultat pour "{searchQuery}"</p>
              )}
            </CardContent>
          </MorphCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
            {filteredFolders.map((folder) => (
              <MorphCard 
                key={folder.id} 
                className={selectedFolderId === folder.id ? 'bg-accent/50' : ''}
                interactive
                onClick={() => onFolderSelect(folder.id)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
                  <CardTitle className="text-base font-medium flex items-center">
                    {selectedFolderId === folder.id ? (
                      <FolderOpen className="h-5 w-5 mr-2 text-primary" />
                    ) : (
                      <Folder className="h-5 w-5 mr-2" />
                    )}
                    {folder.title}
                  </CardTitle>
                  <Badge variant="secondary">
                    {foldersCounts[folder.id] || 0} fichier{foldersCounts[folder.id] !== 1 ? 's' : ''}
                  </Badge>
                </CardHeader>
                {selectedFolderId === folder.id && foldersCounts[folder.id] > 0 && (
                  <CardContent className="p-4 pt-0">
                    <Separator className="my-2" />
                    <div className="flex items-center text-sm text-muted-foreground">
                      <File className="h-4 w-4 mr-2" />
                      Voir les {foldersCounts[folder.id]} fichier{foldersCounts[folder.id] !== 1 ? 's' : ''}
                    </div>
                  </CardContent>
                )}
              </MorphCard>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
