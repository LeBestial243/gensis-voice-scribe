
// Common query parameters
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface SortingParams {
  field: string;
  direction: 'asc' | 'desc';
}

export interface QueryParams {
  pagination?: PaginationParams;
  sorting?: SortingParams;
  filters?: Record<string, any>;
}

// Base entity with audit fields
export interface AuditableEntity {
  created_at: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

// Re-export types from other files for centralized access
export type { ConfidentialityLevel } from './confidentiality';
export type { FileData, FileType } from './files';
export type { AuditLog, AuditAction, ResourceType } from './audit';
export type { 
  ReportType, 
  ActivityReport, 
  ReportContent, 
  ReportSection 
} from './reports';
export type { 
  ProjectStatus, 
  ObjectiveStatus, 
  Project, 
  ProjectObjective, 
  ProjectWithObjectives 
} from './projects';
export type { 
  UseNoteGenerationProps,
  Section,
  FileContent,
  SaveNoteParams,
  NoteFormData,
  FileWithContent
} from './note-generation';
export type { InconsistencyCheck } from './inconsistency';

// Folder entity
export interface Folder extends AuditableEntity {
  id: string;
  title: string;
  profile_id: string;
}

// User profile types
export interface UserProfile extends AuditableEntity {
  id: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}

export interface YoungProfile extends AuditableEntity {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  arrival_date: string;
  structure?: string;
  user_id: string;
}

// Note type
export interface Note extends AuditableEntity {
  id: string;
  title: string;
  content?: string;
  user_id: string;
  confidentiality_level?: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// UI related types
export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SelectOption {
  value: string;
  label: string;
}

// Status type for standardized hooks
export interface StatusState {
  isLoading: boolean;
  isError: boolean;
  loadingState?: Record<string, boolean>;
}
