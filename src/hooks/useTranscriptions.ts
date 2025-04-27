
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PaginationOptions {
  page: number;
  pageSize: number;
}

export function useTranscriptions(
  profileId: string,
  folderId: string | null = null,
  searchQuery: string = "",
  pagination: PaginationOptions = { page: 1, pageSize: 10 }
) {
  const { page, pageSize } = pagination;
  
  // Get folder IDs for filtering
  const { data: folders = [] } = useQuery({
    queryKey: ['folders', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('id')
        .eq('profile_id', profileId);

      if (error) throw error;
      return data;
    },
    enabled: !!profileId && !folderId,
  });

  const folderIds = folderId ? [folderId] : folders.map(folder => folder.id);

  // Count total files for pagination
  const { data: totalCount = 0 } = useQuery({
    queryKey: ['transcriptions_count', profileId, folderIds, searchQuery],
    queryFn: async () => {
      if (!profileId || folderIds.length === 0) return 0;
      
      let query = supabase
        .from('files')
        .select('id', { count: 'exact', head: true })
        .eq('type', 'transcription');
      
      if (folderIds.length > 0) {
        query = query.in('folder_id', folderIds);
      }
      
      // Filter by search query if provided
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }
      
      const { count, error } = await query;
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!profileId && folderIds.length > 0,
  });

  // Fetch files with pagination
  const { data: files = [], isLoading } = useQuery({
    queryKey: ['transcriptions', profileId, folderIds, searchQuery, page, pageSize],
    queryFn: async () => {
      if (!profileId || folderIds.length === 0) return [];
      
      // Calculate range for pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      let query = supabase
        .from('files')
        .select('*')
        .eq('type', 'transcription');
      
      if (folderIds.length > 0) {
        query = query.in('folder_id', folderIds);
      }
      
      // Filter by search query if provided
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profileId && folderIds.length > 0,
  });

  return { 
    files, 
    isLoading, 
    folderIds, 
    totalCount 
  };
}
