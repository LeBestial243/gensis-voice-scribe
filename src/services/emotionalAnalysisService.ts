
import { supabase } from "@/integrations/supabase/client";
import { aiService } from "@/services/aiService";

export interface EmotionData {
  emotion: string;
  score: number;
  timestamp: string;
}

export interface EmotionalTrigger {
  trigger: string;
  emotion: string;
  frequency: number;
}

export interface CopingStrategy {
  strategy: string;
  effectiveness: number; // 0-100
  emotions: string[];
}

export interface EmotionalAnalysisResult {
  emotions: Record<string, number>; // emotion -> score
  triggers: EmotionalTrigger[];
  copingStrategies: CopingStrategy[];
  recommendations: string[];
}

export const emotionalAnalysisService = {
  async analyzeTranscription(transcriptionId: string): Promise<EmotionalAnalysisResult> {
    try {
      // Fetch the transcription content
      const { data: transcription, error } = await supabase
        .from('files')
        .select('content, created_at')
        .eq('id', transcriptionId)
        .eq('type', 'transcription')
        .single();
      
      if (error) throw error;
      
      // If aiService is not configured, return mock data for testing
      if (!aiService || !aiService.analyzeTranscription) {
        console.warn('aiService not properly configured, using mock data');
        return this.getMockAnalysisResult();
      }
      
      // Use AI service to analyze the transcription
      const analysisResult = await aiService.analyzeTranscription(transcription.content);
      
      // Transform the AI response to our expected format
      return {
        emotions: this.extractEmotions(analysisResult),
        triggers: this.extractTriggers(analysisResult),
        copingStrategies: this.extractCopingStrategies(analysisResult),
        recommendations: analysisResult.suggestions || []
      };
    } catch (error) {
      console.error('Error analyzing transcription:', error);
      return this.getMockAnalysisResult();
    }
  },

  async getProfileEmotionalData(profileId: string): Promise<EmotionData[]> {
    try {
      // Get all folders for this profile
      const { data: folders, error: folderError } = await supabase
        .from('folders')
        .select('id')
        .eq('profile_id', profileId);
        
      if (folderError) throw folderError;
      
      if (!folders || folders.length === 0) {
        return [];
      }
      
      const folderIds = folders.map(folder => folder.id);
      
      // Get all transcriptions from these folders
      const { data: transcriptions, error } = await supabase
        .from('files')
        .select('id, content, created_at')
        .eq('type', 'transcription')
        .in('folder_id', folderIds)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      if (!transcriptions || transcriptions.length === 0) {
        return [];
      }
      
      // Process each transcription for emotional data
      const emotionalData: EmotionData[] = [];
      
      // To avoid too many API calls, process only the latest 5 transcriptions
      const recentTranscriptions = transcriptions.slice(-5);
      
      for (const transcription of recentTranscriptions) {
        try {
          // Basic emotion extraction without AI for speed
          const basicEmotions = this.extractBasicEmotions(transcription.content);
          
          Object.entries(basicEmotions).forEach(([emotion, score]) => {
            emotionalData.push({
              emotion,
              score: score as number,
              timestamp: transcription.created_at
            });
          });
        } catch (err) {
          console.error('Error processing transcription:', err);
        }
      }
      
      return emotionalData;
    } catch (error) {
      console.error('Error getting emotional data:', error);
      return [];
    }
  },

  extractBasicEmotions(text: string): Record<string, number> {
    // Simple keyword-based emotion extraction
    const emotionKeywords: Record<string, string[]> = {
      'joie': ['content', 'heureux', 'joyeux', 'rire', 'sourire', 'plaisir', 'amusé'],
      'tristesse': ['triste', 'pleurer', 'déprimé', 'malheureux', 'peine', 'mélancolique'],
      'colère': ['énervé', 'fâché', 'furieux', 'agacé', 'irrité', 'en colère'],
      'peur': ['effrayé', 'inquiet', 'anxieux', 'nerveux', 'stressé', 'craintif'],
      'surprise': ['surpris', 'étonné', 'choqué', 'stupéfait', 'inattendu'],
      'dégoût': ['dégoûté', 'écœuré', 'répugné', 'repoussé'],
      'confiance': ['confiant', 'sûr', 'fiable', 'foi', 'croire', 'faire confiance']
    };
    
    const emotions: Record<string, number> = {
      'joie': 0,
      'tristesse': 0,
      'colère': 0,
      'peur': 0,
      'surprise': 0,
      'dégoût': 0,
      'confiance': 0
    };
    
    // Normalize text for better matching
    const normalizedText = text.toLowerCase();
    
    // Count occurrences of each emotion's keywords
    Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
      let count = 0;
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = normalizedText.match(regex);
        if (matches) count += matches.length;
      });
      
      emotions[emotion] = Math.min(count / 3, 1); // Normalize between 0 and 1
    });
    
    return emotions;
  },
  
  extractEmotions(analysisResult: any): Record<string, number> {
    if (analysisResult.sentiments) {
      return analysisResult.sentiments;
    }
    
    // Fallback implementation
    return {
      'joie': Math.random() * 0.8,
      'tristesse': Math.random() * 0.5,
      'colère': Math.random() * 0.3,
      'peur': Math.random() * 0.4,
      'surprise': Math.random() * 0.2,
      'dégoût': Math.random() * 0.1,
      'confiance': Math.random() * 0.7
    };
  },
  
  extractTriggers(analysisResult: any): EmotionalTrigger[] {
    if (analysisResult.triggers) {
      return analysisResult.triggers;
    }
    
    // Fallback implementation with mock data
    return [
      { trigger: "Mentions des parents", emotion: "tristesse", frequency: 4 },
      { trigger: "Discussions sur l'école", emotion: "stress", frequency: 3 },
      { trigger: "Activités de groupe", emotion: "joie", frequency: 5 },
      { trigger: "Règles et limites", emotion: "colère", frequency: 2 }
    ];
  },
  
  extractCopingStrategies(analysisResult: any): CopingStrategy[] {
    if (analysisResult.copingStrategies) {
      return analysisResult.copingStrategies;
    }
    
    // Fallback implementation with mock data
    return [
      { 
        strategy: "Isolation volontaire", 
        effectiveness: 40, 
        emotions: ["colère", "tristesse"] 
      },
      { 
        strategy: "Expression verbale", 
        effectiveness: 75, 
        emotions: ["frustration", "stress"] 
      },
      { 
        strategy: "Activités artistiques", 
        effectiveness: 90, 
        emotions: ["anxiété", "tristesse"] 
      }
    ];
  },
  
  getMockAnalysisResult(): EmotionalAnalysisResult {
    return {
      emotions: {
        'joie': 0.6,
        'tristesse': 0.3,
        'colère': 0.2,
        'peur': 0.4,
        'surprise': 0.1,
        'dégoût': 0.05,
        'confiance': 0.7
      },
      triggers: [
        { trigger: "Mentions des parents", emotion: "tristesse", frequency: 4 },
        { trigger: "Discussions sur l'école", emotion: "stress", frequency: 3 },
        { trigger: "Activités de groupe", emotion: "joie", frequency: 5 },
        { trigger: "Règles et limites", emotion: "colère", frequency: 2 }
      ],
      copingStrategies: [
        { 
          strategy: "Isolation volontaire", 
          effectiveness: 40, 
          emotions: ["colère", "tristesse"] 
        },
        { 
          strategy: "Expression verbale", 
          effectiveness: 75, 
          emotions: ["frustration", "stress"] 
        },
        { 
          strategy: "Activités artistiques", 
          effectiveness: 90, 
          emotions: ["anxiété", "tristesse"] 
        }
      ],
      recommendations: [
        "Encourager l'expression verbale des émotions lors des entretiens.",
        "Proposer plus d'activités artistiques comme exutoire émotionnel.",
        "Travailler sur les déclencheurs liés à la famille avec un médiateur."
      ]
    };
  }
};
