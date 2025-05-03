
import { Json } from "@/integrations/supabase/types";
import { AuditableEntity } from "./index";

export type ReportType = 'monthly' | 'quarterly' | 'yearly' | 'custom';

export interface ActivityReport extends Omit<AuditableEntity, 'updated_at' | 'created_by' | 'updated_by'> {
  id: string;
  title: string;
  report_type: ReportType | string;
  period_start: string;
  period_end: string;
  content?: Json | Record<string, any>;
  user_id: string;
}

export interface ReportContent {
  sections: ReportSection[];
  metadata?: Record<string, any>;
}

export interface ReportSection {
  title: string;
  content: string;
  type?: 'text' | 'metrics' | 'chart' | 'table';
  data?: any;
}

export interface OfficialReport {
  id: string;
  profileId: string;
  profile_id?: string;
  title: string;
  reportType?: string;
  report_type?: string;
  periodStart?: string;
  period_start?: string;
  periodEnd?: string;
  period_end?: string;
  createdAt?: string;
  created_at?: string;
  sections?: ReportSection[];
  templateId?: string;
  template_id?: string;
  institution?: string;
  status?: "draft" | "final";
  updatedAt?: string;
  updated_at?: string;
  createdBy?: string;
  created_by?: string;
}

export interface OfficialReportTemplate {
  id: string;
  name: string;
  description: string;
  structure: {
    sections: {
      title: string;
      type: string;
      placeholder?: string;
    }[];
  };
}
