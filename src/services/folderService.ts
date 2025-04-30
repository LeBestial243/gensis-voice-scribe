
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const folderService = {
  async getFolders(profileId: string) {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('profile_id', profileId)
      .order('title', { ascending: true });
      
    if (error) throw error;
    return data || [];
  },
  
  async createFolder(profileId: string, title: string) {
    const { data, error } = await supabase
      .from('folders')
      .insert({ title, profile_id: profileId })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },
  
  async deleteFolder(folderId: string) {
    // First delete all files in the folder
    const { data: files } = await supabase
      .from('files')
      .select('path')
      .eq('folder_id', folderId);
    
    if (files && files.length > 0) {
      const filePaths = files.filter(file => file.path).map(file => file.path);
      if (filePaths.length > 0) {
        await supabase.storage
          .from('files')
          .remove(filePaths);
      }
    }
    
    // Delete all file records
    await supabase
      .from('files')
      .delete()
      .eq('folder_id', folderId);
    
    // Finally delete the folder
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId);
    
    if (error) throw error;
    return true;
  },
  
  async getFolderCounts(folderIds: string[]) {
    if (!folderIds.length) return {};
    
    const { data, error } = await supabase
      .from('files')
      .select('folder_id')
      .in('folder_id', folderIds);
    
    if (error) throw error;
    
    const counts: Record<string, number> = {};
    folderIds.forEach(id => { counts[id] = 0; });
    
    if (data) {
      data.forEach(file => {
        counts[file.folder_id] = (counts[file.folder_id] || 0) + 1;
      });
    }
    
    return counts;
  }
};
