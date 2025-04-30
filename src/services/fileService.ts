
import { supabase } from "@/integrations/supabase/client";
import { FileType } from "@/types/files";
import { auditService } from "./auditService";

export const fileService = {
  async getFiles(folderId: string) {
    if (!folderId) return [];
    
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('folder_id', folderId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
  
  async uploadFile(file: File, folderId: string) {
    const fileName = file.name;
    const filePath = `${folderId}/${Date.now()}_${fileName}`;
    
    const { error: storageError, data: storageData } = await supabase.storage
      .from('files')
      .upload(filePath, file);

    if (storageError) {
      if (file.type.includes('text') || file.size < 100000) {
        const text = await file.text();
        
        const { data, error: dbError } = await supabase
          .from('files')
          .insert({
            name: fileName,
            folder_id: folderId,
            type: file.type,
            size: file.size,
            path: null,
            content: text
          })
          .select()
          .single();
          
        if (dbError) throw dbError;
        return data;
      } else {
        throw storageError;
      }
    }
    
    const { data, error } = await supabase
      .from('files')
      .insert({
        name: fileName,
        folder_id: folderId,
        type: file.type,
        size: file.size,
        path: filePath
      })
      .select()
      .single();
      
    if (error) throw error;
    
    // Log file upload in audit
    try {
      await auditService.logAction(
        'upload',
        'file',
        data.id,
        { file_name: fileName, folder_id: folderId }
      );
    } catch (logError) {
      console.error('Failed to log file upload:', logError);
    }
    
    return data;
  },
  
  async downloadFile(file: FileType) {
    if (!file.path && file.content) {
      // For text-based files stored directly in the database
      const blob = new Blob([file.content], { type: file.type || 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      // Log file download in audit
      try {
        await auditService.logAction(
          'download',
          'file',
          file.id,
          { file_name: file.name }
        );
      } catch (logError) {
        console.error('Failed to log file download:', logError);
      }
      
      return url;
    }
    
    if (!file.path) {
      throw new Error("File has no path and no content");
    }
    
    const { data, error } = await supabase.storage
      .from('files')
      .createSignedUrl(file.path, 60);
      
    if (error) throw error;
    if (!data?.signedUrl) throw new Error("Failed to generate signed URL");
    
    // Log file download in audit
    try {
      await auditService.logAction(
        'download',
        'file',
        file.id,
        { file_name: file.name }
      );
    } catch (logError) {
      console.error('Failed to log file download:', logError);
    }
    
    return data.signedUrl;
  },
  
  async deleteFile(fileId: string) {
    // First get the file to check if it has a path
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();
    
    if (fetchError) throw fetchError;
    
    // If the file has a path, delete it from storage
    if (file?.path) {
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove([file.path]);
      
      if (storageError) {
        console.error('Error removing file from storage:', storageError);
        // Continue with deletion even if storage removal fails
      }
    }
    
    // Delete the file record from the database
    const { error } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId);
    
    if (error) throw error;
    
    // Log file deletion in audit
    try {
      await auditService.logAction(
        'delete',
        'file',
        fileId,
        { file_name: file?.name || 'unknown' }
      );
    } catch (logError) {
      console.error('Failed to log file deletion:', logError);
    }
    
    return true;
  },
  
  async renameFile(fileId: string, newName: string) {
    const { data, error } = await supabase
      .from('files')
      .update({ name: newName })
      .eq('id', fileId)
      .select()
      .single();
      
    if (error) throw error;
    
    // Log file rename in audit
    try {
      await auditService.logAction(
        'update',
        'file',
        fileId,
        { new_name: newName, old_name: data.name }
      );
    } catch (logError) {
      console.error('Failed to log file rename:', logError);
    }
    
    return data;
  },
  
  async updateConfidentiality(fileId: string, level: string) {
    const { data, error } = await supabase
      .from('files')
      .update({ confidentiality_level: level })
      .eq('id', fileId)
      .select()
      .single();
      
    if (error) throw error;
    
    // Log confidentiality change in audit
    try {
      await auditService.logAction(
        'update',
        'file',
        fileId,
        { confidentiality: level, file_name: data.name }
      );
    } catch (logError) {
      console.error('Failed to log confidentiality change:', logError);
    }
    
    return data;
  }
};
