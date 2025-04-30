

import { AuditableEntity, ConfidentialityLevel } from "./index";

export interface FileData extends AuditableEntity {
  id: string;
  name: string;
  type: string;
  size: number;
  path: string;
  folder_id: string;
  content?: string;
  confidentiality_level?: ConfidentialityLevel | string;
}

export type FileType = FileData;
