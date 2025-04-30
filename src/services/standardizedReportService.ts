
import { supabase } from "@/integrations/supabase/client";
import { StandardizedReport, ReportTemplate, ReportSection } from "@/types/casf";
import { formatSupabaseError } from "@/utils/errorHandler";
import { auditService } from "./auditService";

export const standardizedReportService = {
  async getReportsByProfileId(profileId: string): Promise<StandardizedReport[]> {
    try {
      const { data, error } = await supabase
        .from('standardized_reports')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });
      
      if (error) throw formatSupabaseError(error);
      return data || [];
    } catch (error) {
      throw error;
    }
  },

  async getReportById(reportId: string): Promise<StandardizedReport> {
    try {
      const { data, error } = await supabase
        .from('standardized_reports')
        .select('*')
        .eq('id', reportId)
        .single();
      
      if (error) throw formatSupabaseError(error);
      return data;
    } catch (error) {
      throw error;
    }
  },

  async createReport(report: Omit<StandardizedReport, 'id' | 'created_at' | 'updated_at'>): Promise<StandardizedReport> {
    try {
      const { data, error } = await supabase
        .from('standardized_reports')
        .insert(report)
        .select()
        .single();
      
      if (error) throw formatSupabaseError(error);
      
      // Log the audit action
      await auditService.logAction('create', 'report', data.id, { 
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
    updates: Partial<Omit<StandardizedReport, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<StandardizedReport> {
    try {
      const { data, error } = await supabase
        .from('standardized_reports')
        .update(updates)
        .eq('id', reportId)
        .select()
        .single();
      
      if (error) throw formatSupabaseError(error);
      
      // Log the audit action
      await auditService.logAction('update', 'report', reportId, { 
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
        .from('standardized_reports')
        .delete()
        .eq('id', reportId);
      
      if (error) throw formatSupabaseError(error);
      
      // Log the audit action
      await auditService.logAction('delete', 'report', reportId);
    } catch (error) {
      throw error;
    }
  },
  
  // Report Templates
  
  async getTemplates(): Promise<ReportTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw formatSupabaseError(error);
      return data || [];
    } catch (error) {
      throw error;
    }
  },
  
  async getTemplateById(templateId: string): Promise<ReportTemplate> {
    try {
      const { data, error } = await supabase
        .from('report_templates')
        .select('*, sections(*)')
        .eq('id', templateId)
        .single();
      
      if (error) throw formatSupabaseError(error);
      
      // Format the response to match the expected structure
      const formattedTemplate = {
        ...data,
        sections: data.sections || []
      };
      
      return formattedTemplate;
    } catch (error) {
      throw error;
    }
  }
};
