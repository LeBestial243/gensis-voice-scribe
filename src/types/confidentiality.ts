export type ConfidentialityLevel = 'public' | 'restricted' | 'confidential' | 'strict';

export const confidentialityLevels: Record<ConfidentialityLevel, {
  label: string;
  description: string;
  color: string;
}> = {
  public: {
    label: 'Public',
    description: 'Visible par tous les utilisateurs',
    color: 'bg-green-500'
  },
  restricted: {
    label: 'Restreint',
    description: 'Visible uniquement par les utilisateurs autorisés',
    color: 'bg-blue-500'
  },
  confidential: {
    label: 'Confidentiel',
    description: 'Informations sensibles à accès limité',
    color: 'bg-amber-500'
  },
  strict: {
    label: 'Strictement confidentiel',
    description: 'Informations hautement sensibles avec accès très restreint',
    color: 'bg-red-500'
  }
};

export interface AccessPermission {
  level: ConfidentialityLevel;
  can_view: boolean;
  can_edit: boolean;
}

export interface ConfidentialitySettings {
  defaultLevels: {
    transcriptions: ConfidentialityLevel;
    notes: ConfidentialityLevel;
    projects: ConfidentialityLevel;
    reports: ConfidentialityLevel;
  };
  roleAccess: Record<string, Record<ConfidentialityLevel, 'none' | 'read' | 'write'>>;
}

// Default confidentiality settings
export const defaultConfidentialitySettings: ConfidentialitySettings = {
  defaultLevels: {
    transcriptions: 'restricted',
    notes: 'restricted',
    projects: 'public',
    reports: 'restricted'
  },
  roleAccess: {
    admin: {
      public: 'write',
      restricted: 'write',
      confidential: 'write',
      strict: 'write'
    },
    educator: {
      public: 'write',
      restricted: 'write',
      confidential: 'read',
      strict: 'none'
    },
    observer: {
      public: 'read',
      restricted: 'read',
      confidential: 'none',
      strict: 'none'
    }
  }
};

// Helper function to check if a user with a certain role can access content with a specific confidentiality level
export function canAccessContent(
  userRole: string,
  contentLevel: ConfidentialityLevel,
  requiredAccess: 'read' | 'write' = 'read',
  settings: ConfidentialitySettings = defaultConfidentialitySettings
): boolean {
  const roleSettings = settings.roleAccess[userRole];
  
  if (!roleSettings) {
    return false;
  }
  
  const accessLevel = roleSettings[contentLevel];
  
  if (requiredAccess === 'read') {
    return accessLevel === 'read' || accessLevel === 'write';
  } else {
    return accessLevel === 'write';
  }
}
