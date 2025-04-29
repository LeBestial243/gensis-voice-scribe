
export interface FileData {
  id: string;
  name: string;
  type: string;
  size: number;
  path: string;
  folder_id: string;
  created_at: string | null;
  updated_at: string | null;
  content?: string;
}

export type FileType = FileData;
