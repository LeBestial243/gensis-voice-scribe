
import { useQuery } from "@tanstack/react-query";
import { transcriptionService, TranscriptionPaginationOptions } from "@/services/transcriptionService";
import { useErrorHandler } from "@/utils/errorHandler";

export function useTranscriptions(
  profileId: string,
  folderId: string | null = null,
  searchQuery: string = "",
  pagination: TranscriptionPaginationOptions = { page: 1, pageSize: 10 }
) {
  const { handleError } = useErrorHandler();

  // Use the transcription service to get data
  const { data, isLoading, error } = useQuery({
    queryKey: ['transcriptions', profileId, folderId, searchQuery, pagination.page, pagination.pageSize],
    queryFn: () => transcriptionService.getTranscriptions(profileId, folderId, searchQuery, pagination),
    enabled: !!profileId,
    meta: {
      onError: (error: unknown) => {
        handleError(error, "Chargement des transcriptions");
      }
    }
  });

  return { 
    files: data?.files || [], 
    isLoading, 
    error,
    folderIds: data?.folderIds || [], 
    totalCount: data?.totalCount || 0
  };
}
