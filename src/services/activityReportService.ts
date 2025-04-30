
import { supabase } from "@/integrations/supabase/client";
import { ActivityReport, ActivityMetric } from "@/types/casf";
import { formatSupabaseError } from "@/utils/errorHandler";
import { auditService } from "./auditService";

export const activityReportService = {
  async getReports(filters?: { 
    report_type?: string, 
    start_date?: string, 
    end_date?: string 
  }): Promise<ActivityReport[]> {
    try {
      let query = supabase
        .from('activity_reports')
        .select('*');
      
      // Apply filters if provided
      if (filters) {
        if (filters.report_type) {
          query = query.eq('report_type', filters.report_type);
        }
        if (filters.start_date) {
          query = query.gte('period_start', filters.start_date);
        }
        if (filters.end_date) {
          query = query.lte('period_end', filters.end_date);
        }
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw formatSupabaseError(error);
      return data || [];
    } catch (error) {
      throw error;
    }
  },

  async getReportById(reportId: string): Promise<ActivityReport> {
    try {
      const { data, error } = await supabase
        .from('activity_reports')
        .select('*')
        .eq('id', reportId)
        .single();
      
      if (error) throw formatSupabaseError(error);
      return data;
    } catch (error) {
      throw error;
    }
  },

  async createReport(report: Omit<ActivityReport, 'id' | 'created_at'>): Promise<ActivityReport> {
    try {
      const { data, error } = await supabase
        .from('activity_reports')
        .insert(report)
        .select()
        .single();
      
      if (error) throw formatSupabaseError(error);
      
      // Log the audit action
      await auditService.logAction('create', 'activity_report', data.id, { 
        title: report.title,
        report_type: report.report_type
      });
      
      return data;
    } catch (error) {
      throw error;
    }
  },

  async updateReport(
    reportId: string, 
    updates: Partial<Omit<ActivityReport, 'id' | 'user_id' | 'created_at'>>
  ): Promise<ActivityReport> {
    try {
      const { data, error } = await supabase
        .from('activity_reports')
        .update(updates)
        .eq('id', reportId)
        .select()
        .single();
      
      if (error) throw formatSupabaseError(error);
      
      // Log the audit action
      await auditService.logAction('update', 'activity_report', reportId, { 
        title: updates.title,
        report_type: updates.report_type
      });
      
      return data;
    } catch (error) {
      throw error;
    }
  },
  
  async deleteReport(reportId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('activity_reports')
        .delete()
        .eq('id', reportId);
      
      if (error) throw formatSupabaseError(error);
      
      // Log the audit action
      await auditService.logAction('delete', 'activity_report', reportId);
    } catch (error) {
      throw error;
    }
  },
  
  // Activity Metrics
  
  async getMetrics(
    period_start: string, 
    period_end: string,
    category?: string
  ): Promise<ActivityMetric[]> {
    try {
      let query = supabase
        .from('activity_metrics')
        .select('*')
        .gte('period_start', period_start)
        .lte('period_end', period_end);
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query;
      
      if (error) throw formatSupabaseError(error);
      return data || [];
    } catch (error) {
      throw error;
    }
  }
};
