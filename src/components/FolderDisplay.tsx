
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { FolderGrid } from "./folder/FolderGrid";
import { UploadDialog } from "./folder/UploadDialog";

interface FolderDisplayProps {
  profileId: string;
  searchQuery: string;
  activeFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
}

export function FolderDisplay({ 
  profileId, 
  searchQuery,
  activeFolderId,
  onFolderSelect
}: FolderDisplayProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadFolderId, setUploadFolderId] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['folders', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: folderCounts = {} } = useQuery({
    queryKey: ['folders_file_count', profileId, folders],
    queryFn: async () => {
      if (!folders.length) return {};
      
      const { data, error } = await supabase
        .from('files')
        .select('folder_id')
        .in('folder_id', folders.map(f => f.id));
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      folders.map(f => f.id).forEach(id => {
        counts[id] = (data || []).filter(file => file.folder_id === id).length;
      });
      
      return counts;
    },
    enabled: folders.length > 0,
  });

  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      if (!uploadFolderId) throw new Error("No folder selected");
      
      const filePath = `${uploadFolderId}/${Date.now()}_${file.name}`;
      
      const { error: storageError } = await supabase.storage
        .from('files')
        .upload(filePath, file);
  
      if (storageError) {
        if (file.type.includes('text') || file.size < 100000) {
          const text = await file.text();
          
          const { data, error: dbError } = await supabase
            .from('files')
            .insert({
              name: file.name,
              folder_id: uploadFolderId,
              type: file.type,
              size: file.size,
              path: null,
              content: text
            })
            .select()
            .single();
            
          if (dbError) throw dbError;
          return data;
        }
        throw storageError;
      }
      
      const { data, error } = await supabase
        .from('files')
        .insert({
          name: file.name,
          folder_id: uploadFolderId,
          type: file.type,
          size: file.size,
          path: filePath
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['folder_counts'] });
      
      toast({ 
        title: "Fichier téléchargé", 
        description: "Le fichier a été téléchargé avec succès" 
      });
      setIsUploadOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erreur lors du téléchargement",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive",
      });
    }
  });

  const handleUploadClick = (folderId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setUploadFolderId(folderId);
    setIsUploadOpen(true);
  };

  const filteredFolders = folders.filter(folder =>
    folder.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (foldersLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-sm bg-muted rounded-xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher un dossier..."
            value={searchQuery}
            className="pl-10 border-0 shadow-none bg-transparent"
          />
        </div>
      </div>

      <FolderGrid
        folders={filteredFolders}
        activeFolderId={activeFolderId}
        folderCounts={folderCounts}
        onFolderSelect={onFolderSelect}
        onUploadClick={handleUploadClick}
      />

      <UploadDialog
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        onUpload={(file) => uploadFile.mutate(file)}
        isUploading={uploadFile.isPending}
      />
    </div>
  );
}
