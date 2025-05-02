
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

// Updated to match the changes in reports.ts
export interface OfficialReportType {
  id: string;
  profileId: string;
  title: string;
  reportType: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  sections: {
    title: string;
    content: string | string[] | Record<string, any>;
  }[];
  templateId?: string;
  institution?: string;
  status?: "draft" | "final";
  updatedAt?: string;
  createdBy?: string;
  
  // Adding snake_case aliases for backward compatibility
  report_type?: string;
  period_start?: string;
  period_end?: string;
}
