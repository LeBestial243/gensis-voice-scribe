
import { supabase } from "@/integrations/supabase/client";
import { formatSupabaseError } from "@/utils/errorHandler";
import { 
  EducationalProject,
  ProjectObjective, 
  ProjectNote,
  ProjectEventLog,
  ProjectStatus,
  ObjectiveStatus,
  ProjectEventType,
  ConfidentialityLevel 
} from "@/types/casf";

export const projectService = {
  // Projets éducatifs
  async getProjects(profileId: string, filters?: { status?: ProjectStatus[] }): Promise<EducationalProject[]> {
    try {
      let query = supabase
        .from('educational_projects')
        .select('*')
        .eq('profile_id', profileId);
        
      // Appliquer les filtres
      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw formatSupabaseError(error);
      return data as EducationalProject[] || [];
    } catch (error) {
      throw error;
    }
  },

  async getProjectById(projectId: string): Promise<EducationalProject> {
    try {
      const { data, error } = await supabase
        .from('educational_projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (error) throw formatSupabaseError(error);
      return data as EducationalProject;
    } catch (error) {
      throw error;
    }
  },

  async createProject(
    project: Omit<EducationalProject, 'id' | 'created_at' | 'updated_at'>, 
    userId: string
  ): Promise<EducationalProject> {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('educational_projects')
        .insert({
          ...project,
          created_at: now,
          updated_at: now,
          created_by: userId,
          updated_by: userId
        })
        .select()
        .single();
      
      if (error) throw formatSupabaseError(error);
      
      // Journaliser la création
      await this.logProjectEvent(data.id, {
        event_type: 'creation',
        content: `Création du projet "${project.title}"`,
        created_by: userId
      });
      
      return data as EducationalProject;
    } catch (error) {
      throw error;
    }
  },

  async updateProject(
    projectId: string,
    updates: Partial<Omit<EducationalProject, 'id' | 'profile_id' | 'created_at' | 'created_by'>>,
    userId: string
  ): Promise<EducationalProject> {
    try {
      // Récupérer l'état actuel pour le journal d'événements
      const currentProject = await this.getProjectById(projectId);
      
      const { data, error } = await supabase
        .from('educational_projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          updated_by: userId
        })
        .eq('id', projectId)
        .select()
        .single();
      
      if (error) throw formatSupabaseError(error);
      
      // Si le statut a changé, journaliser le changement
      if (updates.status && updates.status !== currentProject.status) {
        await this.logProjectEvent(projectId, {
          event_type: 'status_change',
          content: `Changement de statut: ${currentProject.status} -> ${updates.status}`,
          metadata: {
            previous_status: currentProject.status,
            new_status: updates.status
          },
          created_by: userId
        });
      }
      
      // Journaliser la mise à jour générale
      await this.logProjectEvent(projectId, {
        event_type: 'update',
        content: `Mise à jour du projet "${data.title}"`,
        created_by: userId
      });
      
      return data as EducationalProject;
    } catch (error) {
      throw error;
    }
  },

  async deleteProject(projectId: string, userId: string): Promise<boolean> {
    try {
      // Récupérer le projet pour l'audit
      const project = await this.getProjectById(projectId);
      
      // Supprimer le projet (cascades to objectives, notes, and event logs due to FK constraints)
      const { error } = await supabase
        .from('educational_projects')
        .delete()
        .eq('id', projectId);
      
      if (error) throw formatSupabaseError(error);
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Objectifs de projet
  async getProjectObjectives(projectId: string): Promise<ProjectObjective[]> {
    try {
      const { data, error } = await supabase
        .from('project_objectives')
        .select('*')
        .eq('project_id', projectId)
        .order('target_date', { ascending: true });
      
      if (error) throw formatSupabaseError(error);
      return data as ProjectObjective[] || [];
    } catch (error) {
      throw error;
    }
  },

  async createObjective(
    objective: Omit<ProjectObjective, 'id' | 'created_at' | 'updated_at'>,
    userId: string
  ): Promise<ProjectObjective> {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('project_objectives')
        .insert({
          ...objective,
          created_at: now,
          updated_at: now
        })
        .select()
        .single();
      
      if (error) throw formatSupabaseError(error);
      
      // Journaliser l'ajout de l'objectif
      await this.logProjectEvent(objective.project_id, {
        event_type: 'update',
        objective_id: data.id,
        content: `Ajout de l'objectif: "${objective.title}"`,
        created_by: userId
      });
      
      return data as ProjectObjective;
    } catch (error) {
      throw error;
    }
  },

  async updateObjective(
    objectiveId: string, 
    updates: Partial<Omit<ProjectObjective, 'id' | 'project_id' | 'created_at'>>,
    userId: string
  ): Promise<ProjectObjective> {
    try {
      // Récupérer l'objectif actuel pour le journal
      const { data: currentObjective, error: fetchError } = await supabase
        .from('project_objectives')
        .select('*')
        .eq('id', objectiveId)
        .single();
        
      if (fetchError) throw formatSupabaseError(fetchError);
      
      const { data, error } = await supabase
        .from('project_objectives')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', objectiveId)
        .select()
        .single();
      
      if (error) throw formatSupabaseError(error);
      
      // Si le statut a changé, journaliser le changement
      if (updates.status && updates.status !== currentObjective.status) {
        await this.logProjectEvent(currentObjective.project_id, {
          event_type: 'status_change',
          objective_id: objectiveId,
          content: `Changement de statut de l'objectif "${data.title}": ${currentObjective.status} -> ${updates.status}`,
          metadata: {
            previous_status: currentObjective.status,
            new_status: updates.status
          },
          created_by: userId
        });
      }
      
      // Si la progression a changé, journaliser
      if (updates.progress !== undefined && updates.progress !== currentObjective.progress) {
        await this.logProjectEvent(currentObjective.project_id, {
          event_type: 'update',
          objective_id: objectiveId,
          content: `Mise à jour de la progression de l'objectif "${data.title}": ${currentObjective.progress || 0}% -> ${updates.progress}%`,
          created_by: userId
        });
      }
      
      return data as ProjectObjective;
    } catch (error) {
      throw error;
    }
  },

  async deleteObjective(objectiveId: string, userId: string): Promise<boolean> {
    try {
      // Récupérer l'objectif pour le journal
      const { data: objective, error: fetchError } = await supabase
        .from('project_objectives')
        .select('*')
        .eq('id', objectiveId)
        .single();
        
      if (fetchError) throw formatSupabaseError(fetchError);
      
      // Supprimer l'objectif
      const { error } = await supabase
        .from('project_objectives')
        .delete()
        .eq('id', objectiveId);
      
      if (error) throw formatSupabaseError(error);
      
      // Journaliser la suppression
      await this.logProjectEvent(objective.project_id, {
        event_type: 'update',
        content: `Suppression de l'objectif: "${objective.title}"`,
        created_by: userId
      });
      
      return true;
    } catch (error) {
      throw error;
    }
  },
  
  // Notes de projet
  async addProjectNote(
    note: Omit<ProjectNote, 'id' | 'created_at'>,
    userId: string
  ): Promise<ProjectNote> {
    try {
      const { data, error } = await supabase
        .from('project_notes')
        .insert({
          ...note,
          created_at: new Date().toISOString(),
          created_by: userId
        })
        .select()
        .single();
        
      if (error) throw formatSupabaseError(error);
      
      // Journaliser l'ajout de la note
      await this.logProjectEvent(note.project_id, {
        event_type: 'update',
        objective_id: note.objective_id,
        content: `Ajout d'une note${note.objective_id ? " pour l'objectif" : ""}`,
        created_by: userId
      });
      
      return data as ProjectNote;
    } catch (error) {
      throw error;
    }
  },
  
  async getProjectNotes(
    projectId: string, 
    objectiveId?: string
  ): Promise<ProjectNote[]> {
    try {
      let query = supabase
        .from('project_notes')
        .select('*')
        .eq('project_id', projectId);
        
      if (objectiveId) {
        query = query.eq('objective_id', objectiveId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw formatSupabaseError(error);
      return data as ProjectNote[] || [];
    } catch (error) {
      throw error;
    }
  },
  
  // Journal d'événements
  async getProjectEventLogs(
    projectId: string,
    objectiveId?: string
  ): Promise<ProjectEventLog[]> {
    try {
      let query = supabase
        .from('project_event_logs')
        .select('*')
        .eq('project_id', projectId);
        
      if (objectiveId) {
        query = query.eq('objective_id', objectiveId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw formatSupabaseError(error);
      return data as ProjectEventLog[] || [];
    } catch (error) {
      throw error;
    }
  },
  
  async logProjectEvent(
    projectId: string,
    event: Omit<ProjectEventLog, 'id' | 'project_id' | 'created_at'>
  ): Promise<void> {
    try {
      await supabase
        .from('project_event_logs')
        .insert({
          project_id: projectId,
          objective_id: event.objective_id,
          event_type: event.event_type,
          content: event.content,
          metadata: event.metadata || {},
          created_at: new Date().toISOString(),
          created_by: event.created_by
        });
    } catch (error) {
      console.error(`Error logging project event:`, error);
      // Ne pas faire échouer l'opération principale
    }
  }
};
