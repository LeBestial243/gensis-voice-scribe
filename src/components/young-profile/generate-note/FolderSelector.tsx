
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Folder, ChevronDown, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { FolderFileList } from "./FolderFileList";
import { FileType } from "@/types/files";

interface FolderSelectorProps {
  profileId: string;
  selectedFolders: string[];
  onFolderSelect: (folderId: string) => void;
}

interface FolderWithFiles {
  id: string;
  title: string;
  created_at: string;
  files: FileType[];
}

interface FolderWithStats extends FolderWithFiles {
  fileCount: number;
  relevantContent: number;
}

export function FolderSelector({ profileId, selectedFolders, onFolderSelect }: FolderSelectorProps) {
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [folderStats, setFolderStats] = useState<FolderWithStats[]>([]);

  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['folders', profileId],
    queryFn: async () => {
      console.log('FolderSelector: Fetching folders for profile', profileId);
      
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
            size,
            path,
            folder_id,
            created_at,
            updated_at,
            content
          )
        `)
        .eq('profile_id', profileId)
        .order('title');

      if (error) {
        console.error('FolderSelector: Error fetching folders', error);
        throw error;
      }

      console.log('FolderSelector: Fetched folders', data?.length || 0);
      return data as FolderWithFiles[] || [];
    },
  });

  // Update folderStats when folders data changes
  useEffect(() => {
    if (folders && folders.length > 0) {
      const stats = folders.map(folder => {
        // Make sure files is always an array
        const files = folder.files || [];
        
        // Count all files
        const fileCount = files.length;
        
        // Count only relevant content (transcriptions or text files)
        const relevantContent = files.filter(file => 
          file.type === 'transcription' || 
          file.type === 'text' || 
          file.type === 'text/plain' ||
          (file.name && file.name.toLowerCase().includes('transcription'))
        ).length;

        console.log(`Folder ${folder.title}: ${fileCount} files, ${relevantContent} relevant`);
        
        return {
          ...folder,
          fileCount,
          relevantContent
        };
      });
      
      setFolderStats(stats);
    } else {
      setFolderStats([]);
    }
  }, [folders]);

  const handleFolderClick = (folderId: string) => {
    console.log('FolderSelector: Folder clicked', folderId);
    onFolderSelect(folderId);
  };

  const toggleFolderExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

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

  if (folderStats.length === 0) {
    return (
      <div className="text-center p-6 border border-dashed rounded-lg">
        <Folder className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">Aucun dossier disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-sm">Dossiers disponibles</h3>
        <Badge variant="secondary">
          {selectedFolders.length} dossier(s) sélectionné(s)
        </Badge>
      </div>
      
      <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
        {folderStats.map((folder) => {
          const isSelected = selectedFolders.includes(folder.id);
          const isExpanded = expandedFolders.includes(folder.id);
          
          return (
            <div key={folder.id} className="space-y-2">
              <Card 
                className={cn(
                  "transition-all duration-200 cursor-pointer border",
                  isSelected 
                    ? 'border-purple-500 bg-purple-50/50 shadow-sm' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                )}
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
                        <button 
                          type="button"
                          className="flex items-center gap-1"
                          onClick={(e) => toggleFolderExpand(folder.id, e)}
                        >
                          {folder.fileCount > 0 && (
                            isExpanded ? 
                              <ChevronDown className="h-4 w-4 text-gray-400" /> : 
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                          )}
                          <Folder className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        </button>
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

              {isExpanded && folder.files && (
                <div className="ml-8">
                  <FolderFileList files={folder.files} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
