
interface AIServiceConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  temperature: number;
}

export class AIService {
  private config: AIServiceConfig;
  
  constructor(config: AIServiceConfig) {
    this.config = config;
  }

  /**
   * Analyse une transcription pour en extraire les informations clés
   */
  async analyzeTranscription(
    transcription: string, 
    profileContext?: any
  ): Promise<{
    entities: Array<{name: string, type: string}>,
    themes: string[],
    sentiments: {positive: number, negative: number, neutral: number},
    keyPoints: string[],
    inconsistencies: {type: string, message: string}[],
    suggestions: string[]
  }> {
    try {
      const response = await fetch(`${this.config.baseURL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          text: transcription,
          profileContext,
          model: this.config.model,
          temperature: this.config.temperature
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de l\'analyse de la transcription:', error);
      throw error;
    }
  }
  
  /**
   * Génère une note structurée à partir de multiples sources
   */
  async generateStructuredNote(
    templateId: string,
    files: Array<{id: string, content: string, type: string}>,
    profileData: any,
    customInstructions?: string
  ): Promise<{
    title: string,
    content: string,
    sections: Array<{title: string, content: string}>,
    metadata: any
  }> {
    try {
      const response = await fetch(`${this.config.baseURL}/generate-note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          templateId,
          files,
          profileData,
          customInstructions,
          model: this.config.model,
          temperature: this.config.temperature
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la génération de la note:', error);
      throw error;
    }
  }
  
  /**
   * Détecte les inconsistances dans un document ou entre plusieurs documents
   */
  async detectInconsistencies(documents: string[]): Promise<{
    type: string,
    message: string,
    severity: 'low' | 'medium' | 'high',
    relatedText: string
  }[]> {
    try {
      const response = await fetch(`${this.config.baseURL}/detect-inconsistencies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          documents,
          model: this.config.model
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la détection d\'inconsistances:', error);
      throw error;
    }
  }
  
  /**
   * Génère des recommandations personnalisées basées sur l'historique
   */
  async generateRecommendations(
    profileId: string, 
    recentObservations: string[],
    projectObjectives: any[]
  ): Promise<{
    recommendations: string[],
    rationales: string[],
    priorityLevel: 'low' | 'medium' | 'high'
  }> {
    try {
      const response = await fetch(`${this.config.baseURL}/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          profileId,
          recentObservations,
          projectObjectives,
          model: this.config.model,
          temperature: 0.3 // Température plus basse pour des recommandations plus cohérentes
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la génération de recommandations:', error);
      throw error;
    }
  }
}

// Create a singleton instance with default configuration
// This can be overridden in the app initialization
export const aiService = new AIService({
  apiKey: "",  // Will need to be set from environment or config
  baseURL: "https://api.example.com/ai", // Replace with actual API endpoint
  model: "gpt-4",
  temperature: 0.7
});
