
import { Json } from "@/integrations/supabase/types";
import { AuditableEntity } from "./index";

export type ReportType = 'monthly' | 'quarterly' | 'yearly' | 'custom';
export type StandardizedReportType = 'activity' | 'standardized' | 'note' | 'evaluation';

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

export interface ReportTemplate {
  id: string;
  title: string;
  description?: string;
  sections?: ReportSection[];
  type?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ReportMetadata {
  period_start?: string;
  period_end?: string;
  author?: string;
  tags?: string[];
  category?: string;
  confidentiality_level?: string;
  profile_id?: string;
  [key: string]: any;
}

export interface SourceFile {
  id: string;
  name: string;
  type: string;
  size?: number;
  content?: string;
  folderName?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OfficialReport {
  id?: string;
  title: string;
  reportType: StandardizedReportType;
  startDate: string;
  endDate: string;
  sections: ReportSection[];
  content?: Record<string, any>;
  metadata?: ReportMetadata;
  profile_id?: string;
  confidentiality_level?: string;
}
