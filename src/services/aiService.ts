
import { supabase } from '@/integrations/supabase/client';
import { ConfidentialityLevel } from '@/types/confidentiality';

export interface AIServiceConfig {
  apiEndpoint: string;
  apiKey: string;
  model: string;
  temperature?: number;
}

/**
 * Service principal pour toutes les fonctionnalités IA de l'application
 */
export class AIService {
  private config: AIServiceConfig;
  
  constructor(config: AIServiceConfig) {
    this.config = {
      temperature: 0.3,
      ...config
    };
  }
  
  /**
   * Analyse une transcription pour en extraire les informations clés
   */
  async analyzeTranscription(
    text: string, 
    profileData?: any
  ): Promise<{
    text: string;
    hasError: boolean;
    errorMessage?: string | null;
    inconsistencies?: string[];
    entities?: {name: string, type: string}[];
    themes?: string[];
    summary?: string;
    suggestions?: string[]; // Added for emotionalAnalysisService
  }> {
    try {
      // Utiliser la fonction Edge de Supabase pour l'analyse
      const { data, error } = await supabase.functions.invoke('analyze-transcription', {
        body: { 
          text,
          profileData,
          model: this.config.model,
          temperature: this.config.temperature
        }
      });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Erreur lors de l\'analyse de la transcription:', error);
      throw error;
    }
  }
  
  /**
   * Génère une note structurée à partir de multiples fichiers
   */
  async generateNote(
    templateId: string | null,
    files: any[],
    profileData: any
  ): Promise<{
    title: string;
    content: string;
    sections?: {title: string, content: string}[];
  }> {
    try {
      // Préparer les données des fichiers pour l'API
      const filesData = files.map(file => ({
        id: file.id,
        name: file.name,
        content: file.content,
        type: file.type,
        created_at: file.created_at
      }));
      
      // Appeler la fonction Edge pour la génération
      const { data, error } = await supabase.functions.invoke('generate-note', {
        body: { 
          templateId,
          files: filesData,
          profileData,
          model: this.config.model,
          temperature: this.config.temperature
        }
      });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Erreur lors de la génération de la note:', error);
      throw error;
    }
  }
  
  /**
   * Génère un rapport CASF conforme
   */
  async generateCASFReport(
    reportType: 'admission' | 'evaluation' | 'periodic' | 'incident' | 'custom',
    profileData: any,
    observations: any[],
    projectData?: any
  ): Promise<{
    title: string;
    content: {
      sections: {title: string, content: string}[];
    };
    confidentiality_level: ConfidentialityLevel;
    compliance_status: {
      compliant: boolean;
      issues: string[];
      recommendations: string[];
    };
  }> {
    try {
      // Appeler la fonction Edge pour la génération
      const { data, error } = await supabase.functions.invoke('generate-casf-report', {
        body: { 
          reportType,
          profileData,
          observations,
          projectData,
          model: this.config.model,
          temperature: this.config.temperature || 0.2 // Température plus basse pour meilleure conformité
        }
      });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Erreur lors de la génération du rapport CASF:', error);
      throw error;
    }
  }
  
  /**
   * Vérifie la conformité d'un rapport existant
   */
  async verifyCASFCompliance(
    reportContent: string,
    reportType: string
  ): Promise<{
    compliant: boolean;
    issues: {section: string, issue: string, severity: 'minor' | 'major', recommendation: string}[];
    overallScore: number;
  }> {
    try {
      // Appeler la fonction Edge pour la vérification
      const { data, error } = await supabase.functions.invoke('verify-casf-compliance', {
        body: { 
          reportContent,
          reportType,
          model: this.config.model,
          temperature: 0.1 // Température très basse pour précision maximale
        }
      });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Erreur lors de la vérification de conformité:', error);
      throw error;
    }
  }
  
  /**
   * Suggère des objectifs éducatifs pour un jeune
   */
  async suggestEducationalObjectives(
    profileId: string,
    currentObjectives: any[] = []
  ): Promise<{
    objectives: {
      title: string;
      description: string;
      recommended_timeframe: string;
      category: string;
      difficulty: 'easy' | 'medium' | 'hard';
      rationale: string;
    }[];
  }> {
    try {
      // Récupération des données du profil
      const { data: profileData, error: profileError } = await supabase
        .from('young_profiles')
        .select('*')
        .eq('id', profileId)
        .single();
        
      if (profileError) throw profileError;
      
      // Récupération des observations récentes - Fix the query
      const { data: folderIds } = await supabase
        .from('folders')
        .select('id')
        .eq('profile_id', profileId);
        
      if (!folderIds || folderIds.length === 0) {
        return { objectives: [] };
      }
      
      const folderIdArray = folderIds.map(folder => folder.id);
      
      const { data: recentFiles, error: filesError } = await supabase
        .from('files')
        .select('*')
        .in('folder_id', folderIdArray)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (filesError) throw filesError;
      
      // Appeler la fonction Edge pour la suggestion
      const { data, error } = await supabase.functions.invoke('suggest-objectives', {
        body: { 
          profileData,
          recentFiles,
          currentObjectives,
          model: this.config.model
        }
      });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Erreur lors de la suggestion d\'objectifs:', error);
      throw error;
    }
  }
  
  /**
   * Évalue les progrès sur un projet éducatif
   */
  async evaluateProgress(
    projectId: string,
    objectives: any[]
  ): Promise<{
    overall_progress: number;
    objective_evaluations: {
      objective_id: string;
      progress: number;
      status_assessment: string;
      suggested_adjustments: string[];
      next_steps: string[];
    }[];
    project_recommendations: string[];
  }> {
    try {
      // Récupérer les données du projet
      const { data: projectData, error: projectError } = await supabase
        .from('educational_projects')
        .select('*')
        .eq('id', projectId)
        .single();
        
      if (projectError) throw projectError;
      
      // Récupérer le profil associé
      const { data: profileData, error: profileError } = await supabase
        .from('young_profiles')
        .select('*')
        .eq('id', projectData.profile_id)
        .single();
        
      if (profileError) throw profileError;
      
      // Récupérer les observations depuis le début du projet
      const startDate = new Date(projectData.start_date);
      
      // Fix the query using the same approach as above
      const { data: folderIds } = await supabase
        .from('folders')
        .select('id')
        .eq('profile_id', projectData.profile_id);
        
      if (!folderIds || folderIds.length === 0) {
        return {
          overall_progress: 0,
          objective_evaluations: [],
          project_recommendations: []
        };
      }
      
      const folderIdArray = folderIds.map(folder => folder.id);
      
      const { data: observations, error: obsError } = await supabase
        .from('files')
        .select('*')
        .in('folder_id', folderIdArray)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });
        
      if (obsError) throw obsError;
      
      // Appeler la fonction Edge pour l'évaluation
      const { data, error } = await supabase.functions.invoke('evaluate-progress', {
        body: { 
          projectData,
          profileData,
          objectives,
          observations,
          model: this.config.model
        }
      });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Erreur lors de l\'évaluation des progrès:', error);
      throw error;
    }
  }
  
  /**
   * Génère un rapport officiel
   */
  async generateOfficialReport(
    profileId: string,
    templateId: string,
    periodStart: string,
    periodEnd: string,
    options: {
      includeNotes?: boolean;
      includeTranscriptions?: boolean;
      customInstructions?: string;
    } = {}
  ): Promise<Record<string, any>> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-official-report', {
        body: {
          profileId,
          templateId,
          periodStart,
          periodEnd,
          options,
          model: this.config.model,
          temperature: this.config.temperature || 0.2
        }
      });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error("Erreur lors de la génération du rapport officiel:", error);
      throw error;
    }
  }
  
  /**
   * Détecte les inconsistances dans un ensemble de transcriptions
   * Ajouté pour résoudre l'erreur dans incidentAnalysisService.ts
   */
  async detectInconsistencies(transcriptions: string[]): Promise<any[]> {
    try {
      // Cette fonction serait normalement implémentée pour appeler une fonction Edge
      // Pour le moment, on retourne un tableau vide
      console.warn("Méthode detectInconsistencies appelée mais non implémentée");
      return [];
    } catch (error) {
      console.error("Erreur lors de la détection des inconsistances:", error);
      return [];
    }
  }
}

// Instance par défaut du service IA avec configuration minimale
// À configurer au démarrage de l'application
export const aiService = new AIService({
  apiEndpoint: "https://api.anthropic.com/v1",
  apiKey: "",
  model: "claude-3-sonnet-20240229"
});
