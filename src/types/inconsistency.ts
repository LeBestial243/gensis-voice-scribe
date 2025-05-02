
// Define interfaces for inconsistency checks used in the application
export interface InconsistencyCheck {
  type: string;
  message: string;
  severity?: 'low' | 'medium' | 'high';
  relatedText?: string;
}
