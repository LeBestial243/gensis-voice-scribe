
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
