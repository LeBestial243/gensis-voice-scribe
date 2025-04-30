
import { supabase } from "@/integrations/supabase/client";
import { formatSupabaseError } from "@/utils/errorHandler";
import { Project, ProjectObjective, ProjectStatus, ObjectiveStatus } from "@/types/projects";

export const projectService = {
  // Projets éducatifs
  async getProjects(profileId: string): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from('educational_projects')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });
      
      if (error) throw formatSupabaseError(error);
      return data as Project[] || [];
    } catch (error) {
      throw error;
    }
  },

  async getProjectById(projectId: string): Promise<Project> {
    try {
      const { data, error } = await supabase
        .from('educational_projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (error) throw formatSupabaseError(error);
      return data as Project;
    } catch (error) {
      throw error;
    }
  },

  async createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
    try {
      const { data, error } = await supabase
        .from('educational_projects')
        .insert(project)
        .select()
        .single();
      
      if (error) throw formatSupabaseError(error);
      return data as Project;
    } catch (error) {
      throw error;
    }
  },

  async updateProject(projectId: string, updates: Partial<Omit<Project, 'id' | 'profile_id' | 'created_at' | 'updated_at'>>): Promise<Project> {
    try {
      const { data, error } = await supabase
        .from('educational_projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();
      
      if (error) throw formatSupabaseError(error);
      return data as Project;
    } catch (error) {
      throw error;
    }
  },

  async deleteProject(projectId: string): Promise<boolean> {
    try {
      // This will cascade delete all objectives due to the foreign key constraint
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

  async createObjective(objective: Omit<ProjectObjective, 'id' | 'created_at' | 'updated_at'>): Promise<ProjectObjective> {
    try {
      const { data, error } = await supabase
        .from('project_objectives')
        .insert(objective)
        .select()
        .single();
      
      if (error) throw formatSupabaseError(error);
      return data as ProjectObjective;
    } catch (error) {
      throw error;
    }
  },

  async updateObjective(objectiveId: string, updates: Partial<Omit<ProjectObjective, 'id' | 'project_id' | 'created_at' | 'updated_at'>>): Promise<ProjectObjective> {
    try {
      const { data, error } = await supabase
        .from('project_objectives')
        .update(updates)
        .eq('id', objectiveId)
        .select()
        .single();
      
      if (error) throw formatSupabaseError(error);
      return data as ProjectObjective;
    } catch (error) {
      throw error;
    }
  },

  async deleteObjective(objectiveId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('project_objectives')
        .delete()
        .eq('id', objectiveId);
      
      if (error) throw formatSupabaseError(error);
      return true;
    } catch (error) {
      throw error;
    }
  }
};
