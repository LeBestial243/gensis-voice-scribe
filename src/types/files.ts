
import { ConfidentialityLevel } from "./confidentiality";

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
  confidentiality_level?: ConfidentialityLevel | string;
}

export type FileType = FileData;
