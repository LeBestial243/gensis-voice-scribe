
import { InconsistencyCheck } from "./inconsistency";

export interface BehavioralPattern {
  id: string;
  name: string;
  occurrences: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
  relatedIncidents?: string[];
}

export interface CriticalIncident {
  id: string;
  date: string;
  title: string;
  description: string;
  transcriptionId?: string;
  severity: 'low' | 'medium' | 'high' | 'warning';
  type: 'conflict' | 'distress' | 'health' | 'achievement' | 'regression' | 'other';
  status: 'new' | 'acknowledged' | 'resolved';
  relatedPatterns?: string[];
}

export interface IncidentAnalysisResult {
  incidents: CriticalIncident[];
  patterns: BehavioralPattern[];
  inconsistencies: InconsistencyCheck[];
}
