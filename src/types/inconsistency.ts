
export interface InconsistencyCheck {
  type: string;
  message: string;
  severity: 'error' | 'warning';
}
