
export interface UseNoteGenerationProps {
  profileId: string;
  onSuccess?: () => void;
}

export interface NoteGenerationError {
  message: string;
  code?: string;
}

export interface SaveNoteParams {
  title: string;
  content: string;
}

export interface FileWithContent {
  id: string;
  name: string;
  type: string;
  created_at: string;
  updated_at: string | null;
  path: string;
  size: number;
  folder_id: string;
  content?: string;
}
