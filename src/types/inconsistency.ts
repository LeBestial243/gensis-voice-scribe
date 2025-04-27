
export interface InconsistencyCheck {
  type: 'name' | 'date' | 'age' | 'location' | 'other';
  message: string;
  severity: 'error' | 'warning';
}

export interface YoungProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  arrival_date?: string;
  structure?: string;
}
