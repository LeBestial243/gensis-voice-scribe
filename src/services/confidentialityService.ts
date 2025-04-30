
import { supabase } from "@/integrations/supabase/client";
import { ConfidentialityLevel } from "@/types/confidentiality";
import { AuditAction, ResourceType } from "@/types/audit";
import { auditService } from "./auditService";

// Define tables that support confidentiality levels
type ConfidentialityTable = 'files' | 'notes' | 'projects' | 'reports' | 'transcriptions';

// Type guard to check if a string is a valid confidentiality table
function isConfidentialityTable(table: string): table is ConfidentialityTable {
  return ['files', 'notes', 'projects', 'reports', 'transcriptions'].includes(table);
}

export const confidentialityService = {
  async getResourceConfidentiality(resourceType: string, resourceId: string): Promise<ConfidentialityLevel | null> {
    // Validate if resourceType is a known table with confidentiality support
    if (!isConfidentialityTable(resourceType)) {
      console.error(`Table "${resourceType}" does not support confidentiality levels`);
      return null;
    }
    
    try {
      // Use type assertion to tell TypeScript that resourceType is valid
      const { data, error } = await supabase
        .from(resourceType as any)  // Use 'any' to bypass type checking for table name
        .select('confidentiality_level')
        .eq('id', resourceId)
        .single();
        
      if (error) throw error;
      
      // Handle the case where data could be null
      if (!data) return null;
      
      // Handle the data safely, checking if it exists before accessing properties
      if (data && typeof data === 'object' && 'confidentiality_level' in data) {
        // Added explicit null check before accessing property
        const confidentialityLevel = data?.confidentiality_level as ConfidentialityLevel;
        return confidentialityLevel;
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching confidentiality level: ${error}`);
      return null;
    }
  },
  
  async setResourceConfidentiality(
    resourceType: string, 
    resourceId: string, 
    level: ConfidentialityLevel,
    userId: string
  ) {
    // Validate if resourceType is a known table with confidentiality support
    if (!isConfidentialityTable(resourceType)) {
      throw new Error(`Table "${resourceType}" does not support confidentiality levels`);
    }
    
    try {
      // Use type assertion to tell TypeScript that resourceType is valid
      const { data, error } = await supabase
        .from(resourceType as any)  // Use 'any' to bypass type checking for table name
        .update({ confidentiality_level: level })
        .eq('id', resourceId)
        .select()
        .single();
        
      if (error) throw error;
      
      // Log the action
      await auditService.logAction(
        'update' as AuditAction,
        resourceType as ResourceType,
        resourceId,
        { newLevel: level }
      );
      
      return data;
    } catch (error) {
      console.error(`Error setting confidentiality level: ${error}`);
      throw error; // Re-throw to allow handling by caller
    }
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
