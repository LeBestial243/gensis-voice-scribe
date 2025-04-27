
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
