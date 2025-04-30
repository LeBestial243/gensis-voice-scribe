
import { supabase } from "@/integrations/supabase/client";
import { ConfidentialityLevel } from "@/types/confidentiality";
import { AuditAction, ResourceType } from "@/types/audit";
import { auditService } from "./auditService";

export const confidentialityService = {
  async getResourceConfidentiality(resourceType: string, resourceId: string) {
    const { data, error } = await supabase
      .from(resourceType)
      .select('confidentiality_level')
      .eq('id', resourceId)
      .single();
      
    if (error) throw error;
    return data?.confidentiality_level as ConfidentialityLevel;
  },
  
  async setResourceConfidentiality(
    resourceType: string, 
    resourceId: string, 
    level: ConfidentialityLevel,
    userId: string
  ) {
    const { data, error } = await supabase
      .from(resourceType)
      .update({ confidentiality_level: level })
      .eq('id', resourceId)
      .select()
      .single();
      
    if (error) throw error;
    
    // Log de l'action
    await auditService.logAction(
      'update' as AuditAction,
      resourceType as ResourceType,
      resourceId,
      { newLevel: level }
    );
    
    return data;
  },
  
  async getDefaultSettings() {
    // Récupérer les paramètres par défaut depuis Supabase ou utiliser des valeurs par défaut
    // Pour l'instant, utilisons des valeurs codées en dur
    return {
      defaultLevels: {
        transcriptions: 'restricted' as ConfidentialityLevel,
        notes: 'restricted' as ConfidentialityLevel,
        projects: 'restricted' as ConfidentialityLevel,
        reports: 'confidential' as ConfidentialityLevel
      },
      roleAccess: {
        'admin': {
          'public': 'write',
          'restricted': 'write',
          'confidential': 'write',
          'strict': 'write'
        },
        'director': {
          'public': 'write',
          'restricted': 'write',
          'confidential': 'write',
          'strict': 'read'
        },
        'educator': {
          'public': 'write',
          'restricted': 'write',
          'confidential': 'read',
          'strict': 'none'
        },
        'observer': {
          'public': 'read',
          'restricted': 'read',
          'confidential': 'none',
          'strict': 'none'
        }
      }
    };
  }
};
