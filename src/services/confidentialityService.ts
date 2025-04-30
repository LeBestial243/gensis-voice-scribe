
import { supabase } from "@/integrations/supabase/client";
import { AccessPermission, ConfidentialityLevel, defaultConfidentialitySettings } from "@/types/confidentiality";
import { ConfidentialitySettings as CASTConfidentialitySettings, RoleAccess } from "@/types/casf";
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
  async getDefaultSettings(): Promise<CASTConfidentialitySettings> {
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
