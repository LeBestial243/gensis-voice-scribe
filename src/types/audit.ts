
import { Json } from "@/integrations/supabase/types";

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details?: Record<string, any> | Json;
  created_at?: string;
}

export type AuditAction = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'download'
  | 'upload'
  | 'share'
  | 'print'
  | 'export'
  | 'login'
  | 'logout'
  | 'access_denied';

export type ResourceType = 
  | 'file'
  | 'folder'
  | 'note'
  | 'project'
  | 'objective'
  | 'report'
  | 'profile'
  | 'system';
