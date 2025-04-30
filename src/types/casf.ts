
export type ConfidentialityLevel = 'public' | 'restricted' | 'confidential' | 'strict';

export interface AccessRole {
  id: string;
  name: string;
  description: string;
}

export interface ResourceAccess {
  resourceType: string;
  accessLevel: 'none' | 'read' | 'write';
}

export interface RoleAccess {
  role: string;
  resources: Record<string, 'none' | 'read' | 'write'>;
}

export interface ConfidentialitySettings {
  defaultLevels: Record<string, ConfidentialityLevel>;
  roleAccess: RoleAccess[];
}

export interface AuditLogEntry {
  id: string;
  user_id: string;
  timestamp: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details?: Record<string, any>;
}

// Report types
export type StandardizedReportType = 'admission' | 'evaluation' | 'periodic' | 'incident' | 'custom';
export type ActivityReportType = 'monthly' | 'quarterly' | 'yearly' | 'custom';

export interface ReportSection {
  title: string;
  content: string;
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

export interface StandardizedReport {
  id: string;
  title: string;
  profile_id: string;
  report_type: StandardizedReportType;
  content: {
    sections?: ReportSection[];
    template_id?: string | null;
    [key: string]: any;
  };
  confidentiality_level: ConfidentialityLevel;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface ActivityMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  period_start: string;
  period_end: string;
  category?: string;
}

export interface ActivityReport {
  id: string;
  title: string;
  period_start: string;
  period_end: string;
  report_type: ActivityReportType;
  content: {
    sections?: ReportSection[];
    metrics?: Array<{
      name: string;
      value: number;
      unit: string;
    }>;
    [key: string]: any;
  };
  user_id: string;
  created_at: string;
}

// Project types
export type ProjectStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
export type ObjectiveStatus = 'not_started' | 'in_progress' | 'completed' | 'cancelled';
export type ProjectEventType = 'creation' | 'update' | 'status_change';

export interface EducationalProject {
  id: string;
  profile_id: string;
  title: string;
  objectives?: string;
  status: ProjectStatus;
  start_date: string;
  end_date: string;
  confidentiality_level?: ConfidentialityLevel;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface ProjectObjective {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: ObjectiveStatus;
  progress?: number;
  target_date: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface ProjectNote {
  id: string;
  project_id: string;
  objective_id?: string;
  content: string;
  created_at: string;
  created_by?: string;
}

export interface ProjectEventLog {
  id: string;
  project_id: string;
  objective_id?: string;
  event_type: ProjectEventType;
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
  created_by?: string;
}

export interface ProjectWithObjectives extends EducationalProject {
  objectives_list: ProjectObjective[];
}

// Re-export existing types for consistency
export * from '../types/reports';
export * from '../types/projects';
