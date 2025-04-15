
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FolderDialog } from "@/components/FolderDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, FolderOpen, File } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  // Fetch folders for the profile
  const { data: folders = [], isLoading: foldersLoading } = useQuery({
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
        throw error;
      }
      
      console.log('Folders data:', data);
      return data;
    },
  });

  // Count files in each folder
  const { data: foldersCounts = {} } = useQuery({
    queryKey: ['folders_file_count', profileId, folders],
    queryFn: async () => {
      const folderIds = folders.map(folder => folder.id);
      
      if (folderIds.length === 0) return {};
      
      console.log('Fetching file counts for folders:', folderIds);
      // Get all files for these folders
      const { data, error } = await supabase
        .from('files')
        .select('folder_id')
        .in('folder_id', folderIds);
      
      if (error) {
        console.error('Error fetching file counts:', error);
        throw error;
      }
      
      // Organize counts by folder_id
      const counts: Record<string, number> = {};
      
      // Manual count of files per folder
      for (const folder of folderIds) {
        const filesInFolder = data?.filter(file => file.folder_id === folder) || [];
        counts[folder] = filesInFolder.length;
      }
      
      console.log('Folder counts:', counts);
      return counts;
    },
    enabled: folders.length > 0,
  });

  // Filter folders based on search query
  const filteredFolders = folders.filter(folder => {
    if (!searchQuery) return true;
    return folder.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (foldersLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
          <Card className="bg-muted/50">
            <CardContent className="pt-6 flex flex-col items-center justify-center text-center h-40">
              <Folder className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Aucun dossier trouvé</p>
              {searchQuery && (
                <p className="text-sm text-muted-foreground">Aucun résultat pour "{searchQuery}"</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
            {filteredFolders.map((folder) => (
              <Card 
                key={folder.id} 
                className={`hover:bg-accent/50 transition-colors cursor-pointer ${
                  selectedFolderId === folder.id ? 'bg-accent' : ''
                }`}
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
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
