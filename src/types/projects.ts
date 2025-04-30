
export type ProjectStatus = 'draft' | 'active' | 'completed' | 'archived';
export type ObjectiveStatus = 'pending' | 'in_progress' | 'achieved' | 'canceled';

export interface Project {
  id: string;
  profile_id: string;
  title: string;
  objectives?: string | null;
  start_date: string;
  end_date: string;
  status: ProjectStatus;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectObjective {
  id: string;
  project_id: string;
  title: string;
  description?: string | null;
  target_date: string;
  status: ObjectiveStatus;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectWithObjectives extends Project {
  objectives_count: number;
  pending_objectives: number;
  achieved_objectives: number;
}
