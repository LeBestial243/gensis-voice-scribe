
import { AuditableEntity } from "./index";
import { ConfidentialityLevel } from "./confidentiality";

export type ProjectStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
export type ObjectiveStatus = 'not_started' | 'in_progress' | 'completed' | 'cancelled';

export interface Project extends AuditableEntity {
  id: string;
  title: string;
  objectives?: string;
  status: ProjectStatus | string;
  start_date: string;
  end_date: string;
  profile_id: string;
  confidentiality_level?: ConfidentialityLevel;
}

export interface ProjectObjective extends AuditableEntity {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: ObjectiveStatus | string;
  target_date: string;
  notes?: string;
}

// Fixed to properly extend Project but override the objectives property
export interface ProjectWithObjectives extends Omit<Project, 'objectives'> {
  objectives: ProjectObjective[];
}
