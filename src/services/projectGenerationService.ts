
import { aiService } from './aiService';
import { supabase } from '@/integrations/supabase/client';
import { incidentAnalysisService } from './incidentAnalysisService';
import { IncidentAnalysisResult } from '@/types/incidents';

export interface ProjectRecommendation {
  title: string;
  objectives: string;
  suggestedGoals: {
    title: string;
    description: string;
    targetDate: string;
    priority: 'low' | 'medium' | 'high';
  }[];
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
}

export const projectGenerationService = {
  async generateProjectRecommendations(profileId: string): Promise<ProjectRecommendation> {
    try {
      // Step 1: Get profile data
      const { data: profile } = await supabase
        .from('young_profiles')
        .select('*')
        .eq('id', profileId)
        .single();
      
      if (!profile) {
        throw new Error("Profile not found");
      }
      
      // Step 2: Get incident analysis to understand behavioral patterns
      const analysisResult: IncidentAnalysisResult = await incidentAnalysisService.analyzeProfileTranscriptions(profileId);
      
      // Step 3: Get recent transcriptions (last 3 months)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const { data: folders } = await supabase
        .from('folders')
        .select('id')
        .eq('profile_id', profileId);
      
      if (!folders || folders.length === 0) {
        throw new Error("No folders found for this profile");
      }
      
      const folderIds = folders.map(folder => folder.id);
      
      const { data: recentFiles } = await supabase
        .from('files')
        .select('*')
        .eq('type', 'transcription')
        .in('folder_id', folderIds)
        .gt('created_at', threeMonthsAgo.toISOString())
        .order('created_at', { ascending: false });
      
      const recentObservations = recentFiles?.map(file => file.content) || [];
      
      // Step 4: Get current objectives if any
      const { data: existingProjects } = await supabase
        .from('educational_projects')
        .select('id')
        .eq('profile_id', profileId)
        .eq('status', 'in_progress');
      
      let currentObjectives: any[] = [];
      
      if (existingProjects && existingProjects.length > 0) {
        const { data: objectives } = await supabase
          .from('project_objectives')
          .select('*')
          .in('project_id', existingProjects.map(p => p.id));
        
        currentObjectives = objectives || [];
      }
      
      // Step 5: Use AI to generate recommendations
      // For a real implementation, we would leverage the AI service
      // For now, we'll create reasonable mock data based on the analysis
      
      // Extract strengths from positive incidents
      const strengths = analysisResult.incidents
        .filter(incident => incident.type === 'achievement')
        .map(incident => incident.description)
        .slice(0, 5);
      
      // Extract areas for improvement from negative incidents
      const areasForImprovement = analysisResult.incidents
        .filter(incident => ['conflict', 'distress', 'regression'].includes(incident.type))
        .map(incident => incident.description)
        .slice(0, 5);
      
      // Generate recommendations based on patterns
      const recommendations = analysisResult.patterns.map(pattern => 
        `Travailler sur "${pattern.name}" qui apparaît ${pattern.occurrences} fois dans les observations récentes.`
      ).slice(0, 5);
      
      // If we have few or no recommendations from analysis, add some generic ones
      if (recommendations.length < 3) {
        recommendations.push(
          "Renforcer les compétences de communication interpersonnelle",
          "Développer l'autonomie dans les activités quotidiennes",
          "Favoriser l'expression des émotions de manière adaptée"
        );
      }
      
      // Generate suggested goals based on areas for improvement and patterns
      const suggestedGoals = [];
      
      // Add goals based on patterns
      analysisResult.patterns.forEach((pattern, index) => {
        if (index < 3) { // Limit to 3 pattern-based goals
          const targetDate = new Date();
          targetDate.setMonth(targetDate.getMonth() + 3); // 3 months from now
          
          suggestedGoals.push({
            title: `Amélioration : ${pattern.name}`,
            description: `Travailler sur les comportements liés à "${pattern.name}" en développant des stratégies adaptées`,
            targetDate: targetDate.toISOString(),
            priority: pattern.severity as 'low' | 'medium' | 'high'
          });
        }
      });
      
      // Add goals based on strengths
      if (strengths.length > 0) {
        const targetDate = new Date();
        targetDate.setMonth(targetDate.getMonth() + 2);
        
        suggestedGoals.push({
          title: "Consolidation des acquis",
          description: `Renforcer les compétences déjà acquises: ${strengths[0]}`,
          targetDate: targetDate.toISOString(),
          priority: 'medium'
        });
      }
      
      // Add a generic goal if we don't have enough
      if (suggestedGoals.length < 3) {
        const targetDate = new Date();
        targetDate.setMonth(targetDate.getMonth() + 3);
        
        suggestedGoals.push({
          title: "Développement de l'autonomie",
          description: "Acquérir plus d'indépendance dans les activités quotidiennes",
          targetDate: targetDate.toISOString(),
          priority: 'medium'
        });
      }
      
      // Create project title and objectives
      const firstName = profile.first_name || "";
      const title = `Projet éducatif personnalisé - ${firstName} - ${new Date().toLocaleDateString('fr-FR')}`;
      
      // Create objectives summary
      const objectives = `Ce projet vise à accompagner ${firstName} dans son développement personnel et social, en tenant compte de ses besoins spécifiques et de son parcours. Les objectifs principaux sont : ${suggestedGoals.map(g => g.title.toLowerCase()).join(', ')}.`;
      
      // Return the recommendations
      return {
        title,
        objectives,
        suggestedGoals,
        strengths: strengths.length > 0 ? strengths : ["Aucune force spécifique identifiée dans les dernières observations"],
        areasForImprovement: areasForImprovement.length > 0 ? areasForImprovement : ["Aucune difficulté spécifique identifiée dans les dernières observations"],
        recommendations
      };
    } catch (error) {
      console.error("Error generating project recommendations:", error);
      
      // Return fallback data in case of error
      return {
        title: "Nouveau projet éducatif personnalisé",
        objectives: "Accompagner le jeune dans son développement personnel et social.",
        suggestedGoals: [
          {
            title: "Développer l'autonomie",
            description: "Accompagner le jeune vers plus d'indépendance dans les activités quotidiennes",
            targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            priority: 'medium'
          }
        ],
        strengths: ["Données insuffisantes pour analyser les forces"],
        areasForImprovement: ["Données insuffisantes pour analyser les besoins"],
        recommendations: [
          "Recueillir plus d'observations pour affiner les recommandations",
          "Échanger avec l'équipe pluridisciplinaire pour enrichir l'analyse"
        ]
      };
    }
  }
};
