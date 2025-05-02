
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { emotionalAnalysisService, EmotionData, EmotionalTrigger, CopingStrategy } from "@/services/emotionalAnalysisService";
import { useErrorHandler } from "@/utils/errorHandler";
import { useToast } from "@/hooks/use-toast";

export function useEmotionalAnalysis(profileId: string) {
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const queryClient = useQueryClient();
  
  // State for tracking loading states
  const [analysisInProgress, setAnalysisInProgress] = useState(false);
  
  // Query to get emotional data for the profile
  const emotionalDataQuery = useQuery({
    queryKey: ['emotional-data', profileId],
    queryFn: () => emotionalAnalysisService.getProfileEmotionalData(profileId),
    enabled: !!profileId,
    meta: {
      onError: (error: unknown) => {
        handleError(error, "Chargement des données émotionnelles");
      }
    }
  });
  
  // Process the raw emotional data to get trends over time formatted for the chart
  const getEmotionalTrends = () => {
    const data = emotionalDataQuery.data || [];
    
    if (data.length === 0) {
      return [];
    }
    
    // Group by date first
    const dateGroups: Record<string, { [emotion: string]: number }> = {};
    
    data.forEach(item => {
      const date = new Date(item.timestamp).toISOString().split('T')[0];
      
      if (!dateGroups[date]) {
        dateGroups[date] = {
          joy: 0,
          sadness: 0,
          anger: 0,
          fear: 0,
          surprise: 0,
          disgust: 0
        };
      }
      
      // Add to the appropriate emotion
      if (item.emotion in dateGroups[date]) {
        dateGroups[date][item.emotion] = item.score * 100; // Scale to 0-100
      }
    });
    
    // Convert to array format needed by the chart
    const trends = Object.entries(dateGroups).map(([date, emotions]) => {
      return {
        date,
        ...emotions
      };
    });
    
    // Sort by date
    return trends.sort((a, b) => a.date.localeCompare(b.date));
  };
  
  // Process emotional data to get dominant emotions
  const getDominantEmotions = () => {
    const data = emotionalDataQuery.data || [];
    
    if (data.length === 0) {
      return {};
    }
    
    // Group by emotion and calculate average score
    const emotionScores: Record<string, { total: number, count: number }> = {};
    
    data.forEach(item => {
      if (!emotionScores[item.emotion]) {
        emotionScores[item.emotion] = { total: 0, count: 0 };
      }
      emotionScores[item.emotion].total += item.score;
      emotionScores[item.emotion].count += 1;
    });
    
    // Calculate averages
    const averages: Record<string, number> = {};
    Object.entries(emotionScores).forEach(([emotion, { total, count }]) => {
      averages[emotion] = total / count;
    });
    
    return averages;
  };

  // Analyze a specific transcription
  const analyzeMutation = useMutation({
    mutationFn: (transcriptionId: string) => {
      setAnalysisInProgress(true);
      return emotionalAnalysisService.analyzeTranscription(transcriptionId);
    },
    onSuccess: () => {
      setAnalysisInProgress(false);
      queryClient.invalidateQueries({ queryKey: ['emotional-data', profileId] });
      toast({ 
        title: "Analyse terminée",
        description: "L'analyse émotionnelle a été réalisée avec succès.",
      });
    },
    onError: (error) => {
      setAnalysisInProgress(false);
      handleError(error, "Analyse émotionnelle");
    }
  });

  return {
    data: {
      emotionalData: emotionalDataQuery.data || [],
      emotionalTrends: getEmotionalTrends(),
      dominantEmotions: getDominantEmotions()
    },
    operations: {
      analyzeTranscription: analyzeMutation.mutate,
      refresh: () => queryClient.invalidateQueries({ queryKey: ['emotional-data', profileId] })
    },
    status: {
      isLoading: emotionalDataQuery.isLoading,
      isAnalyzing: analysisInProgress,
      isError: emotionalDataQuery.isError
    }
  };
}
