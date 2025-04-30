
import { supabase } from "@/integrations/supabase/client";
import { AccessPermission, ConfidentialityLevel, defaultConfidentialitySettings } from "@/types/confidentiality";
import { ConfidentialitySettings, AuditLogEntry, RoleAccess } from "@/types/casf";
import { formatSupabaseError } from "@/utils/errorHandler";

export const confidentialityService = {
  /**
   * Retrieves the current user's confidentiality settings
   */
  async getCurrentUserAccess(): Promise<AccessPermission[]> {
    try {
      // This is a mock implementation - in a real app we would query this from a database
      return [
        { level: 'public', can_view: true, can_edit: true },
        { level: 'restricted', can_view: true, can_edit: true },
        { level: 'confidential', can_view: true, can_edit: false },
        { level: 'strict', can_view: false, can_edit: false },
      ];
    } catch (error) {
      throw error;
    }
  },
  
  async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw formatSupabaseError(error);
      
      // Add null check before returning properties from data
      return {
        id: data?.id || userId,
        role: data?.role || 'user',
        name: `${data?.first_name || ''} ${data?.last_name || ''}`.trim() || 'Unknown User'
      };
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get the default confidentiality settings
   */
  async getDefaultSettings(): Promise<ConfidentialitySettings> {
    try {
      // Convert from the existing format to the new CAST format
      const roleAccess: RoleAccess[] = Object.entries(defaultConfidentialitySettings.roleAccess).map(
        ([roleName, accessLevels]) => ({
          role: roleName,
          resources: accessLevels as Record<string, 'none' | 'read' | 'write'>
        })
      );

      return {
        defaultLevels: defaultConfidentialitySettings.defaultLevels,
        roleAccess
      };
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Récupère le niveau de confidentialité d'une ressource
   */
  async getResourceConfidentiality(
    resourceType: string, 
    resourceId: string
  ): Promise<ConfidentialityLevel> {
    try {
      const { data, error } = await supabase
        .from(resourceType)
        .select('confidentiality_level')
        .eq('id', resourceId)
        .single();
        
      if (error) throw formatSupabaseError(error);
      return (data?.confidentiality_level || 'public') as ConfidentialityLevel;
    } catch (error) {
      console.error(`Error fetching confidentiality for ${resourceType}:${resourceId}`, error);
      // Par défaut retourner 'public' en cas d'erreur
      return 'public';
    }
  },
  
  /**
   * Définit le niveau de confidentialité d'une ressource
   */
  async setResourceConfidentiality(
    resourceType: string,
    resourceId: string,
    level: ConfidentialityLevel,
    userId: string
  ): Promise<void> {
    try {
      // 1. Mettre à jour le niveau de confidentialité
      const { error } = await supabase
        .from(resourceType)
        .update({ confidentiality_level: level })
        .eq('id', resourceId);
        
      if (error) throw formatSupabaseError(error);
      
      // 2. Journaliser l'action dans les logs d'audit
      await this.logAuditAction({
        user_id: userId,
        action: 'update_confidentiality',
        resource_type: resourceType,
        resource_id: resourceId,
        details: { 
          previous_level: await this.getResourceConfidentiality(resourceType, resourceId),
          new_level: level 
        }
      });
    } catch (error) {
      console.error(`Error setting confidentiality for ${resourceType}:${resourceId}`, error);
      throw error;
    }
  },
  
  /**
   * Vérifie si un utilisateur a le droit d'accéder à une ressource
   */
  async canUserAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    requiredAccess: 'read' | 'write'
  ): Promise<boolean> {
    try {
      // 1. Obtenir le niveau de confidentialité de la ressource
      const confidentialityLevel = await this.getResourceConfidentiality(resourceType, resourceId);
      
      // 2. Obtenir le rôle de l'utilisateur
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
        
      if (userError) throw formatSupabaseError(userError);
      const userRole = userData.role || 'basic';
      
      // 3. Obtenir les paramètres d'accès selon les rôles
      const settings = await this.getSettings();
      
      // 4. Vérifier si le rôle a le niveau d'accès requis pour ce type de ressource
      const roleAccess = settings.roleAccess.find(ra => ra.role === userRole);
      if (!roleAccess) return false;
      
      const accessLevel = roleAccess.resources[resourceType] || 'none';
      
      // 5. Comparer le niveau d'accès requis avec le niveau autorisé
      if (accessLevel === 'none') return false;
      if (accessLevel === 'read' && requiredAccess === 'write') return false;
      
      // 6. Vérifier les restrictions basées sur le niveau de confidentialité
      if (confidentialityLevel === 'public') return true;
      
      // Pour les niveaux plus restrictifs, vérifications supplémentaires
      if (confidentialityLevel === 'strict' && userRole !== 'director') return false;
      if (confidentialityLevel === 'confidential' && !['director', 'chief_service', 'referent'].includes(userRole)) return false;
      
      // 7. Pour 'restricted', vérifier si l'utilisateur est impliqué directement
      if (confidentialityLevel === 'restricted') {
        // Vérifier si l'utilisateur est un intervenant direct (à implémenter selon votre logique métier)
        // Pour l'exemple, on considère que c'est le cas
        return true;
      }
      
      return true;
    } catch (error) {
      console.error(`Error checking access for user ${userId} to ${resourceType}:${resourceId}`, error);
      // Par défaut refuser l'accès en cas d'erreur
      return false;
    }
  },
  
  /**
   * Journalise une action dans les logs d'audit
   */
  async logAuditAction(logEntry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      await supabase
        .from('audit_logs')
        .insert({
          ...logEntry,
          timestamp: new Date().toISOString(),
          details: logEntry.details || {}
        });
    } catch (error) {
      console.error("Error logging audit action:", error);
      // Ne pas échouer si l'audit logging échoue
    }
  },
  
  /**
   * Récupère les logs d'audit
   */
  async getAuditLogs(
    filters: {
      userId?: string;
      resourceType?: string;
      resourceId?: string;
      action?: string;
      startDate?: string;
      endDate?: string;
    },
    pagination: { page: number; pageSize: number }
  ): Promise<{ logs: AuditLogEntry[]; total: number }> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' });
      
      // Appliquer les filtres
      if (filters.userId) query = query.eq('user_id', filters.userId);
      if (filters.resourceType) query = query.eq('resource_type', filters.resourceType);
      if (filters.resourceId) query = query.eq('resource_id', filters.resourceId);
      if (filters.action) query = query.eq('action', filters.action);
      if (filters.startDate) query = query.gte('timestamp', filters.startDate);
      if (filters.endDate) query = query.lte('timestamp', filters.endDate);
      
      // Appliquer la pagination
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      
      const { data, count, error } = await query
        .order('timestamp', { ascending: false })
        .range(from, to);
        
      if (error) throw formatSupabaseError(error);
      
      return {
        logs: data as AuditLogEntry[],
        total: count || 0
      };
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      return { logs: [], total: 0 };
    }
  },
  
  /**
   * Récupère les paramètres de confidentialité
   */
  async getSettings(): Promise<ConfidentialitySettings> {
    try {
      // Idéalement, ces paramètres seraient stockés en base de données
      // Pour l'exemple, on retourne des valeurs codées en dur
      return {
        defaultLevels: {
          'files': 'restricted',
          'notes': 'restricted',
          'templates': 'public',
          'educational_projects': 'restricted',
          'activity_reports': 'confidential'
        },
        roleAccess: [
          {
            role: 'director',
            resources: {
              'files': 'write',
              'notes': 'write',
              'templates': 'write',
              'educational_projects': 'write',
              'activity_reports': 'write'
            }
          },
          {
            role: 'chief_service',
            resources: {
              'files': 'write',
              'notes': 'write',
              'templates': 'write',
              'educational_projects': 'write',
              'activity_reports': 'write'
            }
          },
          {
            role: 'referent',
            resources: {
              'files': 'write',
              'notes': 'write',
              'templates': 'read',
              'educational_projects': 'write',
              'activity_reports': 'read'
            }
          },
          {
            role: 'educator',
            resources: {
              'files': 'write',
              'notes': 'write',
              'templates': 'read',
              'educational_projects': 'read',
              'activity_reports': 'read'
            }
          },
          {
            role: 'basic',
            resources: {
              'files': 'read',
              'notes': 'read',
              'templates': 'read',
              'educational_projects': 'none',
              'activity_reports': 'none'
            }
          }
        ]
      };
    } catch (error) {
      console.error("Error fetching confidentiality settings:", error);
      // Retourner des paramètres par défaut en cas d'erreur
      return {
        defaultLevels: {
          'files': 'public',
          'notes': 'public',
          'templates': 'public',
          'educational_projects': 'public',
          'activity_reports': 'public'
        },
        roleAccess: []
      };
    }
  },
  
  /**
   * Met à jour les paramètres de confidentialité
   */
  async updateSettings(settings: ConfidentialitySettings, userId: string): Promise<void> {
    try {
      // Idéalement, ces paramètres seraient stockés en base de données
      // Pour l'exemple, on simule juste la mise à jour
      console.log("Updating confidentiality settings:", settings);
      
      // Journaliser l'action
      await this.logAuditAction({
        user_id: userId,
        action: 'update_confidentiality_settings',
        resource_type: 'settings',
        resource_id: 'global',
        details: { 
          new_settings: settings
        }
      });
    } catch (error) {
      console.error("Error updating confidentiality settings:", error);
      throw error;
    }
  },
  
  /**
   * Check if the current user can access content with the specified confidentiality level
   */
  async canAccess(level: ConfidentialityLevel, action: 'view' | 'edit' = 'view'): Promise<boolean> {
    try {
      const permissions = await this.getCurrentUserAccess();
      const permission = permissions.find(p => p.level === level);
      
      if (!permission) return false;
      
      return action === 'view' ? permission.can_view : permission.can_edit;
    } catch (error) {
      console.error("Error checking access permissions:", error);
      return false; // Default to denying access on error
    }
  }
};
