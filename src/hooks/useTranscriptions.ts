
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { transcriptionService, TranscriptionPaginationOptions } from "@/services/transcriptionService";
import { useErrorHandler } from "@/utils/errorHandler";
import { PaginationParams, StatusState } from "@/types";
import { FileData } from "@/types/files";

export interface TranscriptionsData {
  files: FileData[];
  folderIds: string[];
  totalCount: number;
}

export function useTranscriptions(
  profileId: string,
  folderId: string | null = null,
  searchQuery: string = "",
  pagination: PaginationParams = { page: 1, pageSize: 10 }
) {
  const { handleError } = useErrorHandler();
  
  // 1. Standardized loading state
  const [loading, setLoading] = useState({
    exporting: false
  });

  // 2. Consistent query structure
  const transcriptionsQuery = useQuery({
    queryKey: ['transcriptions', profileId, folderId, searchQuery, pagination.page, pagination.pageSize],
    queryFn: () => transcriptionService.getTranscriptions(profileId, folderId, searchQuery, pagination as TranscriptionPaginationOptions),
    enabled: !!profileId,
    meta: {
      onError: (error: unknown) => {
        handleError(error, "Chargement des transcriptions");
      }
    }
  });

  // 3. Standardized return structure
  return {
    data: { 
      files: transcriptionsQuery.data?.files || [], 
      folderIds: transcriptionsQuery.data?.folderIds || [], 
      totalCount: transcriptionsQuery.data?.totalCount || 0
    },
    operations: {
      // Operations would go here when needed
    },
    status: { 
      isLoading: transcriptionsQuery.isLoading,
      isError: !!transcriptionsQuery.error,
      loadingState: loading
    } as StatusState
  };
}
