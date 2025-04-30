
import { supabase } from "@/integrations/supabase/client";
import { formatSupabaseError } from "@/utils/errorHandler";

export interface ActivityReport {
  id: string;
  title: string;
  report_type: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  period_start: string;
  period_end: string;
  content?: Record<string, any>;
  user_id: string;
  created_at?: string;
}

export const reportService = {
  async getReports(filters?: { 
    report_type?: ActivityReport['report_type'], 
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
      return data;
    } catch (error) {
      throw error;
    }
  },

  async updateReport(reportId: string, updates: Partial<Omit<ActivityReport, 'id' | 'user_id' | 'created_at'>>): Promise<ActivityReport> {
    try {
      const { data, error } = await supabase
        .from('activity_reports')
        .update(updates)
        .eq('id', reportId)
        .select()
        .single();
      
      if (error) throw formatSupabaseError(error);
      return data;
    } catch (error) {
      throw error;
    }
  },

  async deleteReport(reportId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('activity_reports')
        .delete()
        .eq('id', reportId);
      
      if (error) throw formatSupabaseError(error);
      return true;
    } catch (error) {
      throw error;
    }
  }
};
