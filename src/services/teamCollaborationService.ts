
import { supabase } from "@/integrations/supabase/client";
import { auditService } from "./auditService";

export interface TeamMember {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  role: string;
  status: 'online' | 'offline' | 'away';
  last_active?: string;
}

export interface SharedNote {
  id: string;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
  profile_id: string;
  comments: Comment[];
}

export interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  shared_note_id: string;
  user_name: string;
}

export interface Activity {
  id: string;
  action: 'added_note' | 'commented' | 'edited' | 'viewed';
  user_id: string;
  resource_type: 'note' | 'comment' | 'project';
  resource_id: string;
  description: string;
  created_at: string;
  user_name: string;
}

export const teamCollaborationService = {
  async getTeamMembers(profileId: string): Promise<TeamMember[]> {
    // In a real implementation, this would fetch from a team_members table
    // For demo purposes, we'll generate some mock team members
    
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .limit(5);
        
      if (error) throw error;
      
      // Create mock team members based on real user profiles with proper null handling
      return (users || []).map((user, index) => {
        const firstName = user.first_name || '';
        const lastName = user.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim() || `Team Member ${index + 1}`;
        
        return {
          id: `team-member-${index}`,
          user_id: user.id,
          full_name: fullName,
          avatar_url: undefined, // No avatar_url in profiles table
          role: index === 0 ? 'Lead Educator' : 
                index === 1 ? 'Psychologist' :
                index === 2 ? 'Social Worker' : 'Educator',
          status: index % 2 === 0 ? 'online' : 'offline' as 'online' | 'offline',
          last_active: new Date().toISOString()
        };
      });
    } catch (error) {
      console.error('Error fetching team members:', error);
      return [];
    }
  },
  
  async getSharedNotes(profileId: string): Promise<SharedNote[]> {
    try {
      const { data: notes, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', profileId)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      
      // Transform notes to shared notes format with mock comments
      return (notes || []).map((note) => ({
        id: note.id,
        title: note.title,
        content: note.content || '',
        created_by: note.user_id,
        created_at: note.created_at || new Date().toISOString(),
        profile_id: profileId,
        comments: this.generateMockComments(note.id)
      }));
    } catch (error) {
      console.error('Error fetching shared notes:', error);
      return [];
    }
  },
  
  async getActivities(profileId: string): Promise<Activity[]> {
    // In a real app, fetch from an activities table
    // For demo, generate mock activities based on recent notes
    try {
      const { data: notes, error } = await supabase
        .from('notes')
        .select('id, title, created_at, user_id')
        .eq('user_id', profileId)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (error) throw error;
      
      // Get some user names for the activities - use first_name and last_name instead of full_name
      const { data: users } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .limit(3);
      
      const userMap = (users || []).reduce((acc, user) => {
        // Handle null first_name and last_name properly
        const firstName = user.first_name || '';
        const lastName = user.last_name || '';
        acc[user.id] = `${firstName} ${lastName}`.trim() || 'Unknown User';
        return acc;
      }, {} as Record<string, string>);
      
      const activities: Activity[] = [];
      
      // Generate activities from notes
      (notes || []).forEach((note, index) => {
        const userName = userMap[note.user_id] || 'Team Member';
        
        // Add note creation activity
        activities.push({
          id: `activity-${note.id}-1`,
          action: 'added_note',
          user_id: note.user_id,
          resource_type: 'note',
          resource_id: note.id,
          description: `${userName} added a new note: "${note.title}"`,
          created_at: note.created_at || new Date().toISOString(),
          user_name: userName
        });
        
        // Add some comment activities
        if (index < 3) {
          const commentUser = Object.keys(userMap)[index % Object.keys(userMap).length];
          const commentUserName = userMap[commentUser] || 'Team Member';
          
          activities.push({
            id: `activity-${note.id}-comment-1`,
            action: 'commented',
            user_id: commentUser,
            resource_type: 'comment',
            resource_id: `comment-${note.id}-1`,
            description: `${commentUserName} commented on "${note.title}"`,
            created_at: new Date(new Date(note.created_at || new Date()).getTime() + 3600000).toISOString(),
            user_name: commentUserName
          });
        }
        
        // Add some edit activities
        if (index % 2 === 0) {
          activities.push({
            id: `activity-${note.id}-edit-1`,
            action: 'edited',
            user_id: note.user_id,
            resource_type: 'note',
            resource_id: note.id,
            description: `${userName} updated note "${note.title}"`,
            created_at: new Date(new Date(note.created_at || new Date()).getTime() + 7200000).toISOString(),
            user_name: userName
          });
        }
      });
      
      // Sort activities by date descending
      return activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      console.error('Error generating activities:', error);
      return [];
    }
  },
  
  async addComment(sharedNoteId: string, userId: string, content: string, userName: string): Promise<Comment> {
    // In a real implementation, insert into a comments table
    // For demo, we'll just create a mock comment and return it
    
    try {
      await auditService.logAction(
        'create',
        'note_comment', // Change from 'comment' to a valid resource type
        sharedNoteId
      );
      
      const comment = {
        id: `comment-${Date.now()}`,
        content,
        user_id: userId,
        created_at: new Date().toISOString(),
        shared_note_id: sharedNoteId,
        user_name: userName
      };
      
      return comment;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },
  
  async updateSharedNote(noteId: string, updates: Partial<SharedNote>): Promise<SharedNote> {
    // In a real implementation, update the notes table
    // For demo, we'll just return the updated note object
    
    try {
      const { data, error } = await supabase
        .from('notes')
        .update({
          title: updates.title,
          content: updates.content
        })
        .eq('id', noteId)
        .select()
        .single();
      
      if (error) throw error;
      
      await auditService.logAction(
        'update',
        'note',
        noteId
      );
      
      return {
        id: data.id,
        title: data.title,
        content: data.content || '',
        created_by: data.user_id,
        created_at: data.created_at,
        profile_id: data.user_id,
        comments: this.generateMockComments(noteId)
      };
    } catch (error) {
      console.error('Error updating shared note:', error);
      throw error;
    }
  },
  
  setupRealtimeSubscription(profileId: string, onUpdate: () => void) {
    // In a real implementation, use Supabase's real-time subscriptions
    const channel = supabase
      .channel(`profile-${profileId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notes',
        filter: `user_id=eq.${profileId}`
      }, () => {
        onUpdate();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  },
  
  // Helper method to generate mock comments
  generateMockComments(noteId: string): Comment[] {
    const commentCount = Math.floor(Math.random() * 4);
    const comments: Comment[] = [];
    
    for (let i = 0; i < commentCount; i++) {
      comments.push({
        id: `comment-${noteId}-${i}`,
        content: [
          "This is really important. We should discuss this further.",
          "Great observation! I noticed this too last week.",
          "I'll follow up on this during our next session.",
          "This connects with what we discussed in the team meeting.",
          "I have some additional insights on this topic."
        ][Math.floor(Math.random() * 5)],
        user_id: `mock-user-${i}`,
        created_at: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
        shared_note_id: noteId,
        user_name: [
          "Marie Laurent",
          "Thomas Dubois",
          "Sarah Martin",
          "Alexandre Petit",
          "Julie Bernard"
        ][Math.floor(Math.random() * 5)]
      });
    }
    
    return comments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
};
