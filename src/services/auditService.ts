
import { supabase } from "@/integrations/supabase/client";
import { formatSupabaseError } from "@/utils/errorHandler";

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details?: Record<string, any>;
  created_at?: string;
}

export const auditService = {
  async logAction(
    action: string,
    resourceType: string,
    resourceId: string,
    details?: Record<string, any>
  ): Promise<string> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }
      
      // Use the database function to log the audit action
      const { data, error } = await supabase
        .rpc('log_audit_action', {
          p_user_id: user.id,
          p_action: action,
          p_resource_type: resourceType,
          p_resource_id: resourceId,
          p_details: details || {}
        });
      
      if (error) throw formatSupabaseError(error);
      return data;
    } catch (error) {
      console.error('Failed to log audit action:', error);
      throw error;
    }
  },

  async getAuditLogs(filters?: { 
    resource_type?: string, 
    resource_id?: string, 
    action?: string,
    start_date?: string,
    end_date?: string
  }): Promise<AuditLog[]> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*');
      
      // Apply filters if provided
      if (filters) {
        if (filters.resource_type) {
          query = query.eq('resource_type', filters.resource_type);
        }
        if (filters.resource_id) {
          query = query.eq('resource_id', filters.resource_id);
        }
        if (filters.action) {
          query = query.eq('action', filters.action);
        }
        if (filters.start_date) {
          query = query.gte('created_at', filters.start_date);
        }
        if (filters.end_date) {
          query = query.lte('created_at', filters.end_date);
        }
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw formatSupabaseError(error);
      return data || [];
    } catch (error) {
      throw error;
    }
  }
};
