
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEmotionalAnalysis } from "@/hooks/useEmotionalAnalysis";
import { EmotionalChart } from "./EmotionalChart";
import { EmotionalTriggers } from "./EmotionalTriggers";
import { CopingStrategies } from "./CopingStrategies";
import { EmotionalRecommendations } from "./EmotionalRecommendations";
import { Loader2 } from "lucide-react";

interface EmotionalAnalysisProps {
  profileId: string;
}

export function EmotionalAnalysis({ profileId }: EmotionalAnalysisProps) {
  const { toast } = useToast();
  const [latestAnalysis, setLatestAnalysis] = useState<any>(null);
  
  const { 
    data: { emotionalData, emotionalTrends },
    operations: { analyzeTranscription, refresh },
    status: { isLoading, isAnalyzing }
  } = useEmotionalAnalysis(profileId);

  const handleAnalyzeTranscription = async (transcriptionId: string) => {
    if (!transcriptionId) {
      toast({
        title: "ID de transcription requis",
        description: "Veuillez sélectionner une transcription à analyser.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await analyzeTranscription(transcriptionId);
      setLatestAnalysis(result);
      refresh();
    } catch (error) {
      console.error("Erreur lors de l'analyse:", error);
    }
  };

  // For demo purposes, we'll use a placeholder ID
  // In a real implementation, this would come from selecting a transcription
  const demoTranscriptionId = "demo-transcription-id";

  return (
    <div className="emotional-analysis space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Analyse émotionnelle</CardTitle>
              <CardDescription>Suivi de l'évolution émotionnelle et des facteurs influents</CardDescription>
            </div>
            <Button
              onClick={() => handleAnalyzeTranscription(demoTranscriptionId)}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>Analyser la dernière transcription</>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <EmotionalChart data={emotionalTrends} />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <EmotionalTriggers 
          triggers={latestAnalysis?.triggers || []}
        />
        
        <CopingStrategies 
          strategies={latestAnalysis?.copingStrategies || []}
        />
      </div>
      
      <EmotionalRecommendations 
        recommendations={latestAnalysis?.recommendations || []}
      />
    </div>
  );
}
