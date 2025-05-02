
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
  
  // Process the raw emotional data to get trends over time
  const getEmotionalTrends = () => {
    const data = emotionalDataQuery.data || [];
    
    if (data.length === 0) {
      return [];
    }
    
    // Group by emotion
    const emotionGroups: Record<string, EmotionData[]> = {};
    
    data.forEach(item => {
      if (!emotionGroups[item.emotion]) {
        emotionGroups[item.emotion] = [];
      }
      emotionGroups[item.emotion].push(item);
    });
    
    // Create trend data by emotion
    const trends = Object.entries(emotionGroups).map(([emotion, items]) => {
      return {
        name: emotion,
        data: items.map(item => ({
          timestamp: new Date(item.timestamp).getTime(),
          value: item.score
        }))
      };
    });
    
    return trends;
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
