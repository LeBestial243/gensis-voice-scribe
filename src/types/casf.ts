
import { ConfidentialityLevel } from "./confidentiality";

export interface EducationalProject {
  id: string;
  profile_id: string;
  title: string;
  objectives: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  confidentiality_level: ConfidentialityLevel;
  created_at: string;
  updated_at: string;
}

export interface ProjectObjective {
  id: string;
  project_id: string;
  title: string;
  description: string;
  target_date: string;
  status: 'pending' | 'in_progress' | 'achieved' | 'canceled';
  notes: string;
}
