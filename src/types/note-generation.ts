
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
}

export interface NoteFormData {
  profileId: string;
  title: string;
  content: string;
  type: string;
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

// Interface mise à jour pour correspondre à celle dans reports.ts
export interface OfficialReportType {
  id: string;
  profileId: string;
  profile_id?: string;
  title: string;
  reportType: string;
  report_type: string;
  startDate: string;
  period_start: string;
  endDate: string;
  period_end: string;
  createdAt: string;
  created_at?: string;
  sections: {
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
