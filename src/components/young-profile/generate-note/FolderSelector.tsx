
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Folder } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface FolderSelectorProps {
  profileId: string;
  selectedFolders: string[];
  onFolderSelect: (folderId: string) => void;
}

export function FolderSelector({ profileId, selectedFolders, onFolderSelect }: FolderSelectorProps) {
  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['folders', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select(`
          id,
          title,
          created_at,
          files (
            id,
            name,
            type,
            created_at,
            content
          )
        `)
        .eq('profile_id', profileId)
        .order('title');

      if (error) throw error;
      return data || [];
    },
  });

  // Calculate file stats for each folder
  const folderStats = folders.map(folder => ({
    ...folder,
    fileCount: folder.files?.length || 0,
    relevantContent: folder.files?.filter(file => 
      file.type === 'transcription' || file.type === 'text'
    ).length || 0
  }));

  if (foldersLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-24" />
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const handleFolderClick = (folderId: string) => {
    onFolderSelect(folderId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-sm">Dossiers disponibles</h3>
        <Badge variant="secondary">
          {selectedFolders.length} dossier(s) sélectionné(s)
        </Badge>
      </div>
      
      {folderStats.length === 0 ? (
        <div className="text-center p-6 border border-dashed rounded-lg">
          <Folder className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Aucun dossier disponible</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {folderStats.map((folder) => {
            const isSelected = selectedFolders.includes(folder.id);
            return (
              <Card 
                key={folder.id} 
                className={`
                  transition-all duration-200 cursor-pointer border
                  ${isSelected 
                    ? 'border-purple-500 bg-purple-50/50 shadow-sm' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }
                `}
                onClick={() => handleFolderClick(folder.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      checked={isSelected}
                      className="mt-1"
                      onCheckedChange={() => handleFolderClick(folder.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-sm truncate">{folder.title}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500">
                          {folder.fileCount} fichier(s) total
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {folder.relevantContent} transcription(s)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
