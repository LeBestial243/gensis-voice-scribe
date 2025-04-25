import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { FileData } from "@/types/files";

export function useTranscriptions(profileId: string, folderId: string | null, searchQuery: string) {
  // Fetch folders for the profile
  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['folders', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('id, title')
        .eq('profile_id', profileId);

      if (error) throw error;
      return data;
    },
  });

  // Get folder IDs
  const folderIds = folders.map(folder => folder.id);

  // Fetch files based on folders
  const { data: files = [], isLoading } = useQuery<FileData[]>({
    queryKey: ['files', profileId, folderId, folderIds],
    queryFn: async () => {
      let query = supabase
        .from('files')
        .select('*');
      
      if (folderId) {
        query = query.eq('folder_id', folderId);
      } else if (folderIds.length > 0) {
        query = query.in('folder_id', folderIds);
      } else {
        return [];
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as FileData[];
    },
    enabled: (folderIds.length > 0 || !!folderId),
  });

  // Filter files based on search query
  const filteredFiles = files.filter(file => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return file.name.toLowerCase().includes(searchLower) || 
           (file.content && file.content.toLowerCase().includes(searchLower));
  });

  return {
    files: filteredFiles,
    isLoading: isLoading || foldersLoading,
    folderIds,
  };
}
