
export type ConfidentialityLevel = 'public' | 'restricted' | 'confidential' | 'strict';

export interface AccessRole {
  id: string;
  name: string;
  description: string;
}

export interface ResourceAccess {
  resourceType: string;
  accessLevel: 'none' | 'read' | 'write';
}

export interface RoleAccess {
  role: string;
  resources: Record<string, 'none' | 'read' | 'write'>;
}

export interface ConfidentialitySettings {
  defaultLevels: Record<string, ConfidentialityLevel>;
  roleAccess: RoleAccess[];
}

export interface AuditLogEntry {
  id: string;
  user_id: string;
  timestamp: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details?: Record<string, any>;
}

// Re-export existing types for consistency
export * from '../types/reports';
export * from '../types/projects';
