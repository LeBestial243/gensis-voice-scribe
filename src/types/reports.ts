
export type ReportType = 'monthly' | 'quarterly' | 'yearly' | 'custom';

export interface ActivityReport {
  id: string;
  title: string;
  report_type: ReportType;
  period_start: string;
  period_end: string;
  content?: any;
  user_id: string;
  created_at?: string;
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
