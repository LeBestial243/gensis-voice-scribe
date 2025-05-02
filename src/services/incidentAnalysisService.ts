
import { aiService } from './aiService';
import { CriticalIncident, BehavioralPattern, IncidentAnalysisResult } from '@/types/incidents';
import { supabase } from '@/integrations/supabase/client';
import { FileData } from '@/types/files';

export const incidentAnalysisService = {
  async analyzeProfileTranscriptions(profileId: string): Promise<IncidentAnalysisResult> {
    try {
      // Get all transcriptions for the profile
      const { data: folders } = await supabase
        .from('folders')
        .select('id')
        .eq('profile_id', profileId);
      
      if (!folders || folders.length === 0) {
        return { incidents: [], patterns: [], inconsistencies: [] };
      }
      
      const folderIds = folders.map(folder => folder.id);
      
      // Get all transcription files from these folders
      const { data: files } = await supabase
        .from('files')
        .select('*')
        .eq('type', 'transcription')
        .in('folder_id', folderIds);
      
      if (!files || files.length === 0) {
        return { incidents: [], patterns: [], inconsistencies: [] };
      }
      
      // Extract transcription texts
      const transcriptions = files.map(file => file.content);
      
      // Detect inconsistencies using the AI service
      const inconsistencies = await aiService.detectInconsistencies(transcriptions);
      
      // For now, let's generate some mock incidents and patterns based on inconsistencies
      // In a real implementation, we would use a more sophisticated AI analysis
      const incidents: CriticalIncident[] = inconsistencies.map((inc, index) => ({
        id: `incident-${index}`,
        date: new Date().toISOString(),
        title: `Incident potentiel: ${inc.type}`,
        description: inc.message,
        transcriptionId: files[index % files.length].id,
        severity: inc.severity || 'medium',
        type: mapInconsistencyToType(inc.type),
        status: 'new' as const // Using 'as const' to ensure TypeScript recognizes this as a literal type
      }));
      
      // Generate mock patterns based on incident types
      const patternMap = new Map<string, BehavioralPattern>();
      
      incidents.forEach(incident => {
        const patternKey = incident.type;
        if (!patternMap.has(patternKey)) {
          patternMap.set(patternKey, {
            id: `pattern-${patternKey}`,
            name: formatPatternName(patternKey),
            occurrences: 1,
            severity: incident.severity as 'low' | 'medium' | 'high',
            description: `Motif comportemental lié aux incidents de type "${formatPatternName(patternKey)}"`,
            relatedIncidents: [incident.id]
          });
        } else {
          const pattern = patternMap.get(patternKey)!;
          pattern.occurrences++;
          pattern.relatedIncidents = [...(pattern.relatedIncidents || []), incident.id];
          
          // Increase severity if multiple occurrences
          if (pattern.occurrences > 3 && pattern.severity === 'low') {
            pattern.severity = 'medium';
          } else if (pattern.occurrences > 5 && pattern.severity === 'medium') {
            pattern.severity = 'high';
          }
        }
      });
      
      return {
        incidents,
        patterns: Array.from(patternMap.values()),
        inconsistencies
      };
    } catch (error) {
      console.error('Error analyzing transcriptions for incidents:', error);
      return { incidents: [], patterns: [], inconsistencies: [] };
    }
  }
};

// Helper functions
function mapInconsistencyToType(type: string): CriticalIncident['type'] {
  const typeMap: Record<string, CriticalIncident['type']> = {
    'date': 'regression',
    'time': 'regression',
    'name': 'conflict',
    'emotion': 'distress',
    'health': 'health',
    'achievement': 'achievement'
  };
  
  return typeMap[type] || 'other';
}

function formatPatternName(key: string): string {
  const nameMap: Record<string, string> = {
    'conflict': 'Conflits interpersonnels',
    'distress': 'Signes de détresse',
    'health': 'Problèmes de santé',
    'achievement': 'Réussites notables',
    'regression': 'Signes de régression',
    'other': 'Autres incidents'
  };
  
  return nameMap[key] || 'Motif non catégorisé';
}
