
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

export interface StandardizedReport {
  id: string;
  title: string;
  profile_id: string;
  report_type: 'admission' | 'evaluation' | 'periodic' | 'incident' | 'custom';
  content: Record<string, any>;
  confidentiality_level: ConfidentialityLevel;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'assessment' | 'checklist' | 'rating';
  order: number;
}

export interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  sections: ReportSection[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivityReport {
  id: string;
  title: string;
  period_start: string;
  period_end: string;
  report_type: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  content: Record<string, any>;
  user_id: string;
  created_at: string;
}

export interface ActivityMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  period_start: string;
  period_end: string;
  category: string;
}

export interface RegulatoryUpdate {
  id: string;
  title: string;
  summary: string;
  content: string;
  publication_date: string;
  effective_date: string;
  source: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}
