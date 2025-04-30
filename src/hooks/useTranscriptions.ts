
import { useQuery } from "@tanstack/react-query";
import { transcriptionService, TranscriptionPaginationOptions } from "@/services/transcriptionService";

export function useTranscriptions(
  profileId: string,
  folderId: string | null = null,
  searchQuery: string = "",
  pagination: TranscriptionPaginationOptions = { page: 1, pageSize: 10 }
) {
  // Use the transcription service to get data
  const { data, isLoading } = useQuery({
    queryKey: ['transcriptions', profileId, folderId, searchQuery, pagination.page, pagination.pageSize],
    queryFn: () => transcriptionService.getTranscriptions(profileId, folderId, searchQuery, pagination),
    enabled: !!profileId
  });

  return { 
    files: data?.files || [], 
    isLoading, 
    folderIds: data?.folderIds || [], 
    totalCount: data?.totalCount || 0
  };
}
