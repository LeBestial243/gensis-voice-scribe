
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

// Updated OfficialReport interface with all required properties
export interface OfficialReport {
  id: string;
  profileId: string;
  title: string;
  reportType: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  sections: {
    title: string;
    content: string | string[] | Record<string, any>;
  }[];
  templateId?: string;
  institution?: string;
  status?: "draft" | "final";
  updatedAt?: string;
  createdBy?: string;
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
