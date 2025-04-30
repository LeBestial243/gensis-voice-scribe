
import { supabase } from "@/integrations/supabase/client";
import { auditService } from "./auditService";

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content?: string;
  created_at?: string;
  updated_at?: string;
  confidentiality_level?: string;
}

export interface NotePaginationOptions {
  page: number;
  pageSize: number;
}

export const notesService = {
  async getNotes(
    userId: string,
    searchQuery: string = "",
    pagination: NotePaginationOptions = { page: 1, pageSize: 10 }
  ) {
    const { page, pageSize } = pagination;
    
    // Calculate range for pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Count total notes
    let countQuery = supabase
      .from('notes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    // Filter by search query if provided
    if (searchQuery) {
      countQuery = countQuery.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
    }
    
    const { count: totalCount, error: countError } = await countQuery;
    
    if (countError) throw countError;
    
    // Fetch notes with pagination
    let fetchQuery = supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId);
    
    // Filter by search query if provided
    if (searchQuery) {
      fetchQuery = fetchQuery.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
    }
    
    const { data: notes = [], error: notesError } = await fetchQuery
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (notesError) throw notesError;
    
    return { notes, totalCount: totalCount || 0 };
  },
  
  async getNoteById(noteId: string): Promise<Note> {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .single();
      
    if (error) throw error;
    
    // Log note access in audit
    try {
      await auditService.logAction(
        'read',
        'note',
        noteId,
        { note_title: data.title }
      );
    } catch (logError) {
      console.error('Failed to log note access:', logError);
    }
    
    return data as Note;
  },
  
  async createNote(userId: string, title: string, content: string, confidentialityLevel: string = 'public'): Promise<Note> {
    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: userId,
        title,
        content,
        confidentiality_level: confidentialityLevel
      })
      .select()
      .single();
      
    if (error) throw error;
    
    // Log note creation in audit
    try {
      await auditService.logAction(
        'create',
        'note',
        data.id,
        { note_title: title }
      );
    } catch (logError) {
      console.error('Failed to log note creation:', logError);
    }
    
    return data as Note;
  },
  
  async updateNote(
    noteId: string, 
    updates: Partial<Pick<Note, 'title' | 'content' | 'confidentiality_level'>>
  ): Promise<Note> {
    const { data, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', noteId)
      .select()
      .single();
      
    if (error) throw error;
    
    // Log note update in audit
    try {
      await auditService.logAction(
        'update',
        'note',
        noteId,
        { note_title: updates.title || data.title }
      );
    } catch (logError) {
      console.error('Failed to log note update:', logError);
    }
    
    return data as Note;
  },
  
  async deleteNote(noteId: string): Promise<boolean> {
    // Get the note first for audit logging
    const { data: note } = await supabase
      .from('notes')
      .select('title')
      .eq('id', noteId)
      .single();
    
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);
      
    if (error) throw error;
    
    // Log note deletion in audit
    try {
      await auditService.logAction(
        'delete',
        'note',
        noteId,
        { note_title: note?.title || 'unknown' }
      );
    } catch (logError) {
      console.error('Failed to log note deletion:', logError);
    }
    
    return true;
  }
};
