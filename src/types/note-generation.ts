
export interface UseNoteGenerationProps {
  profileId: string;
  onSuccess?: () => void;
}

export interface Section {
  id: string;
  title: string;
  instructions: string | null;
  order_index: number;
}

export interface FileContent {
  id: string;
  name: string;
  content: string;
  type: string;
  folderName: string;
}

export interface SaveNoteParams {
  title: string;
  content: string;
  type?: string;
  periodStart?: string;
  periodEnd?: string;
}

export interface NoteFormData {
  profileId: string;
  title: string;
  content: string;
  type: string;
  periodStart?: string;
  periodEnd?: string;
}

export interface NoteMetric {
  name: string;
  value: number;
  description?: string;
}

export interface NoteSectionContent {
  title: string;
  content: string;
  type?: 'text' | 'metrics' | 'chart' | 'table';
  metrics?: NoteMetric[];
}

export interface FileWithContent {
  id: string;
  name: string;
  type: string;
  created_at?: string;
  updated_at?: string;
  path?: string;
  size?: number;
  folder_id?: string;
  content: string;
}

// Interface updated to match the one in reports.ts
export interface OfficialReportType {
  id: string;
  profileId: string;
  profile_id?: string;
  title: string;
  reportType?: string;
  report_type?: string;
  startDate?: string;
  period_start?: string;
  periodStart?: string;
  endDate?: string;
  period_end?: string;
  periodEnd?: string;
  createdAt?: string;
  created_at?: string;
  sections?: {
    title: string;
    content: string | string[] | Record<string, any>;
  }[];
  templateId?: string;
  template_id?: string;
  institution?: string;
  status?: "draft" | "final";
  updatedAt?: string;
  updated_at?: string;
  createdBy?: string;
  created_by?: string;
}

// Types for note categorization
export type NoteType = 'general' | 'observation' | 'meeting' | 'incident' | 'evaluation';

export const NOTE_TYPES: { value: NoteType; label: string }[] = [
  { value: 'general', label: 'Note générale' },
  { value: 'observation', label: 'Observation' },
  { value: 'meeting', label: 'Compte-rendu de réunion' },
  { value: 'incident', label: 'Incident' },
  { value: 'evaluation', label: 'Évaluation' }
];
