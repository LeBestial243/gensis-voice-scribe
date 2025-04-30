
import { useState, useEffect } from 'react';
import { 
  ConfidentialityLevel, 
  ConfidentialitySettings, 
  defaultConfidentialitySettings,
  canAccessContent
} from '@/types/confidentiality';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface UseConfidentialityReturn {
  settings: ConfidentialitySettings;
  userRole: string;
  isLoading: boolean;
  updateDefaultLevel: (
    resourceType: keyof ConfidentialitySettings['defaultLevels'],
    level: ConfidentialityLevel
  ) => Promise<void>;
  updateRoleAccess: (
    role: string,
    level: ConfidentialityLevel,
    access: 'none' | 'read' | 'write'
  ) => Promise<void>;
  canAccess: (
    level: ConfidentialityLevel,
    requiredAccess?: 'read' | 'write'
  ) => boolean;
}

export function useConfidentiality(): UseConfidentialityReturn {
  const [settings, setSettings] = useState<ConfidentialitySettings>(defaultConfidentialitySettings);
  const [userRole, setUserRole] = useState<string>('observer'); // Default to lowest access
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadUserRoleAndSettings() {
      try {
        setIsLoading(true);
        
        // 1. Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('Utilisateur non authentifié');
        }
        
        // 2. Get user profile and role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw profileError;
        
        // Set user role
        setUserRole(profile?.role || 'observer');
        
        // In a real implementation, you might fetch organization-specific 
        // confidentiality settings from the database
        // For now, we just use the default settings
        
        setSettings(defaultConfidentialitySettings);
      } catch (error) {
        console.error('Error loading confidentiality settings:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les paramètres de confidentialité',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadUserRoleAndSettings();
  }, [toast]);
  
  const updateDefaultLevel = async (
    resourceType: keyof ConfidentialitySettings['defaultLevels'],
    level: ConfidentialityLevel
  ) => {
    try {
      // In a real implementation, you would update the settings in the database
      setSettings(prev => ({
        ...prev,
        defaultLevels: {
          ...prev.defaultLevels,
          [resourceType]: level
        }
      }));
      
      toast({
        title: 'Paramètres mis à jour',
        description: `Le niveau de confidentialité par défaut pour ${resourceType} a été mis à jour`
      });
    } catch (error) {
      console.error('Error updating confidentiality settings:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour les paramètres de confidentialité',
        variant: 'destructive'
      });
    }
  };
  
  const updateRoleAccess = async (
    role: string,
    level: ConfidentialityLevel,
    access: 'none' | 'read' | 'write'
  ) => {
    try {
      // In a real implementation, you would update the settings in the database
      setSettings(prev => {
        // Create a new role access map for the specific role
        const updatedRoleAccess = {
          ...(prev.roleAccess[role] || {}),
          [level]: access
        };
        
        // Ensure all required confidentiality levels are present
        const confidentialityLevels: ConfidentialityLevel[] = ['public', 'restricted', 'confidential', 'strict'];
        confidentialityLevels.forEach(confidentialityLevel => {
          if (updatedRoleAccess[confidentialityLevel] === undefined) {
            updatedRoleAccess[confidentialityLevel] = 
              prev.roleAccess[role]?.[confidentialityLevel] || 'none';
          }
        });
        
        return {
          ...prev,
          roleAccess: {
            ...prev.roleAccess,
            [role]: updatedRoleAccess as Record<ConfidentialityLevel, 'none' | 'read' | 'write'>
          }
        };
      });
      
      toast({
        title: 'Paramètres mis à jour',
        description: `Les permissions pour le rôle ${role} ont été mises à jour`
      });
    } catch (error) {
      console.error('Error updating role access:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour les permissions de rôle',
        variant: 'destructive'
      });
    }
  };
  
  const canAccess = (
    level: ConfidentialityLevel,
    requiredAccess: 'read' | 'write' = 'read'
  ) => {
    return canAccessContent(userRole, level, requiredAccess, settings);
  };
  
  return {
    settings,
    userRole,
    isLoading,
    updateDefaultLevel,
    updateRoleAccess,
    canAccess
  };
}
