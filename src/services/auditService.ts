
import { supabase } from "@/integrations/supabase/client";
import { formatSupabaseError } from "@/utils/errorHandler";
import { AuditLog, AuditAction, ResourceType } from "@/types/audit";

export interface GetAuditLogsParams {
  userId?: string;
  action?: AuditAction;
  resourceType?: ResourceType;
  resourceId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export const auditService = {
  async logAction({
    userId,
    action,
    resourceType,
    resourceId,
    details = {}
  }: {
    userId: string;
    action: AuditAction | string;
    resourceType: ResourceType | string;
    resourceId: string;
    details?: Record<string, any>;
  }): Promise<AuditLog> {
    try {
      const auditData = {
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details
      };

      console.log("Logging audit action:", auditData);

      const { data, error } = await supabase
        .from('audit_logs')
        .insert(auditData)
        .select()
        .single();

      if (error) {
        console.error("Error logging audit action:", error);
        throw formatSupabaseError(error);
      }

      return data as AuditLog;
    } catch (error) {
      console.error("Failed to log audit action:", error);
      throw error;
    }
  },

  async getAuditLogs({
    userId,
    action,
    resourceType,
    resourceId,
    startDate,
    endDate,
    limit = 100
  }: GetAuditLogsParams = {}): Promise<AuditLog[]> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*');
      
      // Apply filters if provided
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      if (action) {
        query = query.eq('action', action);
      }
      
      if (resourceType) {
        query = query.eq('resource_type', resourceType);
      }
      
      if (resourceId) {
        query = query.eq('resource_id', resourceId);
      }
      
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      
      if (endDate) {
        query = query.lte('created_at', endDate);
      }
      
      // Order by creation date (newest first) and limit results
      query = query.order('created_at', { ascending: false }).limit(limit);
      
      const { data, error } = await query;
      
      if (error) throw formatSupabaseError(error);
      return data as AuditLog[] || [];
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      throw error;
    }
  },

  async getResourceHistory(resourceType: ResourceType, resourceId: string): Promise<AuditLog[]> {
    return this.getAuditLogs({ resourceType, resourceId });
  },

  async getUserActivity(userId: string, limit = 50): Promise<AuditLog[]> {
    return this.getAuditLogs({ userId, limit });
  }
};
