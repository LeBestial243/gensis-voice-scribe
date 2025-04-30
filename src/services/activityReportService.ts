
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
      // Use actual Supabase call since activity_reports table exists
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
      
      // Convert to our ActivityReport type
      return (data || []).map(item => ({
        id: item.id,
        title: item.title,
        period_start: item.period_start,
        period_end: item.period_end,
        report_type: item.report_type as ActivityReport['report_type'],
        content: item.content || {},
        user_id: item.user_id,
        created_at: item.created_at || new Date().toISOString()
      }));
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
      
      // Convert to our ActivityReport type
      return {
        id: data.id,
        title: data.title,
        period_start: data.period_start,
        period_end: data.period_end,
        report_type: data.report_type as ActivityReport['report_type'],
        content: data.content || {},
        user_id: data.user_id,
        created_at: data.created_at || new Date().toISOString()
      };
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
      
      // Convert to our ActivityReport type
      return {
        id: data.id,
        title: data.title,
        period_start: data.period_start,
        period_end: data.period_end,
        report_type: data.report_type as ActivityReport['report_type'],
        content: data.content || {},
        user_id: data.user_id,
        created_at: data.created_at || new Date().toISOString()
      };
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
      await auditService.logAction('create', 'activity_report', reportId, { 
        title: updates.title,
        report_type: updates.report_type
      });
      
      // Convert to our ActivityReport type
      return {
        id: data.id,
        title: data.title,
        period_start: data.period_start,
        period_end: data.period_end,
        report_type: data.report_type as ActivityReport['report_type'],
        content: data.content || {},
        user_id: data.user_id,
        created_at: data.created_at || new Date().toISOString()
      };
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
      // Mock implementation - in production, this would fetch from activity_metrics table
      console.log(`Fetching metrics from ${period_start} to ${period_end}, category: ${category || 'all'}`);
      
      // Return mock metrics
      const mockMetrics: ActivityMetric[] = [
        {
          id: "1",
          name: "Total Reports",
          value: 24,
          unit: "reports",
          period_start,
          period_end,
          category: "reports"
        },
        {
          id: "2",
          name: "Active Users",
          value: 12,
          unit: "users",
          period_start,
          period_end,
          category: "users"
        }
      ];
      
      if (category) {
        return mockMetrics.filter(m => m.category === category);
      }
      
      return mockMetrics;
    } catch (error) {
      throw error;
    }
  }
};
