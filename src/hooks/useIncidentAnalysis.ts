
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { incidentAnalysisService } from '@/services/incidentAnalysisService';
import { CriticalIncident, BehavioralPattern, IncidentAnalysisResult } from '@/types/incidents';
import { useToast } from './use-toast';

export function useIncidentAnalysis(profileId: string) {
  const { toast } = useToast();
  const [selectedIncident, setSelectedIncident] = useState<CriticalIncident | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<BehavioralPattern | null>(null);
  
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['incidentAnalysis', profileId],
    queryFn: () => incidentAnalysisService.analyzeProfileTranscriptions(profileId),
    enabled: !!profileId,
    meta: {
      onError: (error: unknown) => {
        toast({
          title: "Erreur d'analyse",
          description: "Impossible d'analyser les transcriptions pour ce profil.",
          variant: "destructive"
        });
      }
    }
  });
  
  const handleIncidentSelection = (incident: CriticalIncident) => {
    setSelectedIncident(incident);
    setSelectedPattern(null);
  };
  
  const handlePatternSelection = (pattern: BehavioralPattern) => {
    setSelectedPattern(pattern);
    setSelectedIncident(null);
  };
  
  const handleUpdateIncidentStatus = async (incidentId: string, status: CriticalIncident['status']) => {
    // This would be connected to a backend service in a real implementation
    toast({
      title: "Statut mis à jour",
      description: `Le statut de l'incident a été modifié en "${status}".`
    });
    
    // For now we'll just update the UI
    if (selectedIncident && selectedIncident.id === incidentId) {
      setSelectedIncident({
        ...selectedIncident,
        status
      });
    }
  };
  
  return {
    incidents: data?.incidents || [],
    patterns: data?.patterns || [],
    isLoading,
    isError,
    selectedIncident,
    selectedPattern,
    selectIncident: handleIncidentSelection,
    selectPattern: handlePatternSelection,
    updateIncidentStatus: handleUpdateIncidentStatus,
    refetchAnalysis: refetch
  };
}
