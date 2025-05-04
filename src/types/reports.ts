
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

export interface Template {
  id: string;
  title: string;
  description: string;
  created_at: string;
  word_template_url?: string;
  word_template_filename?: string;
  structure_id?: string;
  is_default?: boolean;
  // Add the structure_name property that's being used in the component
  structure_name?: string;
}

export interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  sections: ReportSection[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}
