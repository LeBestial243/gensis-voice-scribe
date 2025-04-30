import { supabase } from "@/integrations/supabase/client";
import { FileData } from "@/types/files";
import { auditService } from "./auditService";

export interface TranscriptionPaginationOptions {
  page: number;
  pageSize: number;
}

export const transcriptionService = {
  async getTranscriptions(
    profileId: string,
    folderId: string | null = null,
    searchQuery: string = "",
    pagination: TranscriptionPaginationOptions = { page: 1, pageSize: 10 }
  ) {
    const { page, pageSize } = pagination;
    
    // Get folder IDs for filtering if folderId is not provided
    let folderIds: string[] = [];
    
    if (!folderId) {
      const { data: folders = [], error: folderError } = await supabase
        .from('folders')
        .select('id')
        .eq('profile_id', profileId);
        
      if (folderError) throw folderError;
      folderIds = folders.map(folder => folder.id);
    } else {
      folderIds = [folderId];
    }
    
    if (folderIds.length === 0) {
      return { files: [], totalCount: 0, folderIds: [] };
    }
    
    // Calculate range for pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Count total transcriptions
    let countQuery = supabase
      .from('files')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'transcription')
      .in('folder_id', folderIds);
    
    // Filter by search query if provided
    if (searchQuery) {
      countQuery = countQuery.or(`name.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
    }
    
    const { count: totalCount, error: countError } = await countQuery;
    
    if (countError) throw countError;
    
    // Fetch transcriptions with pagination
    let fetchQuery = supabase
      .from('files')
      .select('*')
      .eq('type', 'transcription')
      .in('folder_id', folderIds);
    
    // Filter by search query if provided
    if (searchQuery) {
      fetchQuery = fetchQuery.or(`name.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
    }
    
    const { data: files = [], error: filesError } = await fetchQuery
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (filesError) throw filesError;
    
    // Log access in audit
    try {
      await auditService.logAction(
        'read',
        'transcription',
        profileId
      );
    } catch (logError) {
      console.error('Failed to log transcription access:', logError);
    }
    
    return { files, totalCount: totalCount || 0, folderIds };
  },
  
  async createTranscription(
    folderID: string, 
    fileName: string, 
    content: string,
    audioData: Blob
  ): Promise<FileData> {
    // First upload the audio file
    const filePath = `transcriptions/${Date.now()}_${fileName}.mp3`;
    const { error: storageError } = await supabase.storage
      .from('files')
      .upload(filePath, audioData);
      
    if (storageError) throw storageError;
    
    // Then create the transcription record
    const { data, error } = await supabase
      .from('files')
      .insert({
        name: fileName,
        folder_id: folderID,
        type: 'transcription',
        size: audioData.size,
        path: filePath,
        content: content
      })
      .select()
      .single();
      
    if (error) throw error;
    
    // Log transcription creation in audit
    try {
      await auditService.logAction(
        'create',
        'transcription',
        data.id
      );
    } catch (logError) {
      console.error('Failed to log transcription creation:', logError);
    }
    
    return data as FileData;
  },
  
  async deleteTranscription(transcriptionId: string): Promise<boolean> {
    return await fileService.deleteFile(transcriptionId);
  }
};

// Re-export file service to avoid circular dependencies
import { fileService } from "./fileService";
