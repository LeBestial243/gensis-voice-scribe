
import { supabase } from "@/integrations/supabase/client";
import { AuditLog, AuditAction, ResourceType } from "@/types/audit";

interface GetAuditLogsParams {
  resourceId?: string;
  resourceType?: ResourceType;
  userId?: string;
  action?: AuditAction;
  limit?: number;
}

export const auditService = {
  async getAuditLogs({
    resourceId,
    resourceType,
    userId,
    action,
    limit = 100
  }: GetAuditLogsParams): Promise<AuditLog[]> {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (resourceId) {
      query = query.eq('resource_id', resourceId);
    }
    
    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (action) {
      query = query.eq('action', action);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  },
  
  async logAction(
    action: AuditAction, 
    resourceType: string, 
    resourceId: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc(
        'log_audit_action',
        {
          p_user_id: supabase.auth.getUser().then(res => res.data.user?.id) || null,
          p_action: action,
          p_resource_type: resourceType,
          p_resource_id: resourceId,
          p_details: details || {}
        }
      );
      
      if (error) {
        console.error('Error logging action:', error);
      }
    } catch (err) {
      console.error('Failed to log audit action:', err);
    }
  }
};
