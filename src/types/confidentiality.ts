
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
