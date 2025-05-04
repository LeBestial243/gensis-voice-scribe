
export interface Structure {
  id: string;
  name: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StructureUser {
  id: string;
  user_id: string;
  structure_id: string;
  role: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  display_name?: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  display_name?: string;
}
