
import { useReducer } from "react";

// Define action types
export type NoteGenerationAction =
  | { type: "SET_TEMPLATE"; id: string }
  | { type: "SET_FOLDER"; folderId: string }
  | { type: "SET_FILE"; fileId: string }
  | { type: "SET_CONTENT"; content: string }
  | { type: "SET_TITLE"; title: string }
  | { type: "SET_GENERATING"; isGenerating: boolean }
  | { type: "RESET" };

// Define state type
export interface NoteGenerationState {
  selectedTemplateId: string;
  selectedFolders: string[];
  selectedFiles: string[];
  generatedContent: string;
  noteTitle: string;
  isGenerating: boolean;
}

// Initial state
export const initialNoteGenerationState: NoteGenerationState = {
  selectedTemplateId: "",
  selectedFolders: [],
  selectedFiles: [],
  generatedContent: "",
  noteTitle: `Note IA - ${new Date().toLocaleDateString("fr-FR")}`,
  isGenerating: false,
};

// Reducer function
export function noteGenerationReducer(
  state: NoteGenerationState,
  action: NoteGenerationAction
): NoteGenerationState {
  switch (action.type) {
    case "SET_TEMPLATE":
      return {
        ...state,
        selectedTemplateId: action.id,
      };
    case "SET_FOLDER":
      return {
        ...state,
        selectedFolders: state.selectedFolders.includes(action.folderId)
          ? state.selectedFolders.filter((id) => id !== action.folderId)
          : [...state.selectedFolders, action.folderId],
      };
    case "SET_FILE":
      return {
        ...state,
        selectedFiles: state.selectedFiles.includes(action.fileId)
          ? state.selectedFiles.filter((id) => id !== action.fileId)
          : [...state.selectedFiles, action.fileId],
      };
    case "SET_CONTENT":
      return {
        ...state,
        generatedContent: action.content,
      };
    case "SET_TITLE":
      return {
        ...state,
        noteTitle: action.title,
      };
    case "SET_GENERATING":
      return {
        ...state,
        isGenerating: action.isGenerating,
      };
    case "RESET":
      return {
        ...initialNoteGenerationState,
        noteTitle: `Note IA - ${new Date().toLocaleDateString("fr-FR")}`,
      };
    default:
      return state;
  }
}

// Custom hook
export function useNoteGenerationReducer() {
  const [state, dispatch] = useReducer(
    noteGenerationReducer,
    initialNoteGenerationState
  );

  return { state, dispatch };
}
