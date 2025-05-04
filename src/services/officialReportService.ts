
import { supabase } from "@/integrations/supabase/client";
import { formatSupabaseError } from "@/utils/errorHandler";
import { aiService } from "@/services/aiService";
import { OfficialReport } from "@/types/reports";

export interface OfficialReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
  requiredFields: string[];
  institution: string;
}

export interface ReportSection {
  title: string;
  description?: string;
  required: boolean;
  contentType: "text" | "list" | "table" | "assessment";
}

export type ReportInstitution = 
  | "social_services" 
  | "court"
  | "school"
  | "health"
  | "other";

export interface GenerateReportParams {
  profileId: string;
  templateId: string;
  periodStart: string;
  periodEnd: string;
  includeNotes?: boolean;
  includeTranscriptions?: boolean;
  customInstructions?: string;
}

export const officialReportService = {
  async getReportTemplates(): Promise<OfficialReportTemplate[]> {
    // Mock implementation as we don't have templates table yet
    return [
      {
        id: "social-services-standard",
        name: "Rapport de services sociaux standard",
        description: "Format standardisé pour les services sociaux départementaux",
        institution: "social_services",
        sections: [
          {
            title: "Informations personnelles",
            description: "Détails d'identification du jeune",
            required: true,
            contentType: "text"
          },
          {
            title: "Contexte social",
            description: "Environnement familial et social",
            required: true,
            contentType: "text"
          },
          {
            title: "Objectifs atteints",
            description: "Progrès réalisés pendant la période",
            required: true,
            contentType: "list"
          },
          {
            title: "Observations comportementales",
            description: "Analyse des comportements observés",
            required: true,
            contentType: "assessment"
          },
          {
            title: "Recommandations",
            description: "Actions proposées pour la suite",
            required: true,
            contentType: "list"
          }
        ],
        requiredFields: ["fullName", "birthDate", "referent", "entryDate"]
      },
      {
        id: "court-evaluation",
        name: "Évaluation pour le tribunal",
        description: "Rapport d'évaluation pour les audiences de tribunal",
        institution: "court",
        sections: [
          {
            title: "Informations d'identité",
            required: true,
            contentType: "text"
          },
          {
            title: "Historique du suivi",
            required: true,
            contentType: "text"
          },
          {
            title: "Évolution comportementale",
            required: true,
            contentType: "assessment"
          },
          {
            title: "Respect des obligations",
            required: true,
            contentType: "table"
          },
          {
            title: "Avis professionnel",
            required: true,
            contentType: "text"
          }
        ],
        requiredFields: ["fullName", "birthDate", "caseNumber", "hearingDate"]
      },
      {
        id: "school-report",
        name: "Rapport scolaire",
        description: "Bilan éducatif pour l'établissement scolaire",
        institution: "school",
        sections: [
          {
            title: "Informations de l'élève",
            required: true,
            contentType: "text"
          },
          {
            title: "Assiduité",
            required: true,
            contentType: "table"
          },
          {
            title: "Comportement en classe",
            required: true,
            contentType: "assessment"
          },
          {
            title: "Progrès académiques",
            required: true,
            contentType: "text"
          },
          {
            title: "Recommandations pédagogiques",
            required: true,
            contentType: "list"
          }
        ],
        requiredFields: ["fullName", "birthDate", "schoolName", "grade"]
      }
    ];
  },
  
  async getReportsByProfileId(profileId: string): Promise<OfficialReport[]> {
    try {
      // This would fetch from a real database table in production
      console.log(`Fetching reports for profile: ${profileId}`);
      
      // Mock implementation returning an empty array for now
      return [];
    } catch (error) {
      throw formatSupabaseError(error);
    }
  },
  
  async generateReport(params: GenerateReportParams): Promise<OfficialReport> {
    try {
      const { profileId, templateId, periodStart, periodEnd, includeNotes = true, includeTranscriptions = true } = params;
      
      // 1. Get the profile data
      const { data: profile, error: profileError } = await supabase
        .from('young_profiles')
        .select('*')
        .eq('id', profileId)
        .single();
        
      if (profileError) throw formatSupabaseError(profileError);
      
      // 2. Get folders associated with the profile
      const { data: folders, error: foldersError } = await supabase
        .from('folders')
        .select('id')
        .eq('profile_id', profileId);
        
      if (foldersError) throw formatSupabaseError(foldersError);
      
      const folderIds = folders?.map(folder => folder.id) || [];
      
      // 3. Get notes for the period if needed
      let notes: any[] = [];
      if (includeNotes) {
        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', profileId)
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd);
          
        if (notesError) throw formatSupabaseError(notesError);
        notes = notesData || [];
      }
      
      // 4. Get transcriptions for the period if needed and if folders exist
      let transcriptions: any[] = [];
      if (includeTranscriptions && folderIds.length > 0) {
        const { data: transcriptionsData, error: transcriptionsError } = await supabase
          .from('files')
          .select('*')
          .eq('type', 'transcription')
          .in('folder_id', folderIds)
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd);
          
        if (transcriptionsError) throw formatSupabaseError(transcriptionsError);
        transcriptions = transcriptionsData || [];
      }
      
      // 5. Get the template
      const templates = await this.getReportTemplates();
      const template = templates.find(t => t.id === templateId);
      
      if (!template) {
        throw new Error("Template not found");
      }
      
      // 6. In a real implementation, this would use AI to generate the content
      // For now, we'll return a mock structure that includes transcriptions if requested
      
      // Generate report sections based on template
      const reportSections = template.sections.map(section => {
        // For each section, include relevant content based on section type
        const sectionContent = this.generateSectionContent(
          section, 
          profile, 
          notes, 
          transcriptions, 
          includeTranscriptions
        );
        
        return {
          title: section.title,
          content: sectionContent
        };
      });
      
      // This structure mimics what would be generated by AI
      const reportContent: OfficialReport = {
        id: `report-${Date.now()}`, // This would be a real ID in production
        profileId: profileId,
        title: `${template.name} - ${profile.first_name} ${profile.last_name}`,
        reportType: template.name,
        institution: template.institution,
        periodStart: periodStart,
        periodEnd: periodEnd,
        createdAt: new Date().toISOString(),
        sections: reportSections,
        templateId: templateId
      };
      
      return reportContent;
    } catch (error) {
      console.error("Error generating report:", error);
      throw error;
    }
  },
  
  calculateAge(birthDateString: string): number {
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  },
  
  generateSectionContent(
    section: ReportSection, 
    profile: any, 
    notes: any[], 
    transcriptions: any[],
    includeTranscriptions: boolean
  ) {
    const hasTranscriptions = transcriptions.length > 0 && includeTranscriptions;
    
    switch (section.contentType) {
      case "text":
        let textContent = `Contenu généré automatiquement pour la section "${section.title}" concernant ${profile.first_name} ${profile.last_name}. Basé sur ${notes.length} notes`;
        
        if (hasTranscriptions) {
          textContent += ` et ${transcriptions.length} transcriptions.`;
          
          // Add a sample of transcription content if available
          if (transcriptions.length > 0 && transcriptions[0].content) {
            textContent += `\n\nExtrait de transcription: "${transcriptions[0].content.substring(0, 100)}..."`;
          }
        } else {
          textContent += '.';
        }
        
        return textContent;
        
      case "list":
        const listItems = [
          "Élément 1 généré à partir des données",
          "Élément 2 basé sur l'analyse des notes"
        ];
        
        // Add transcription-based items if available
        if (hasTranscriptions) {
          listItems.push("Élément 3 tiré des transcriptions");
          listItems.push(`${transcriptions.length} transcription(s) analysée(s) pour cette période`);
        }
        
        listItems.push("Élément final synthétisé par l'IA");
        
        return listItems;
        
      case "assessment":
        const assessment = {
          positive: [
            "Point positif 1 observé",
            "Point positif 2 observé"
          ],
          negative: [
            "Point négatif 1 observé",
            "Point négatif 2 observé"
          ],
          recommendations: [
            "Recommandation 1"
          ]
        };
        
        // Add transcription-based insights if available
        if (hasTranscriptions) {
          assessment.positive.push("Point positif observé dans les transcriptions");
          assessment.recommendations.push("Recommandation basée sur l'analyse des transcriptions");
        }
        
        return assessment;
        
      case "table":
        const tableData = {
          headers: ["Date", "Observation", "Importance"],
          rows: [
            ["2023-01-15", "Observation 1", "Haute"],
            ["2023-02-20", "Observation 2", "Moyenne"]
          ]
        };
        
        // Add transcription entries if available
        if (hasTranscriptions && transcriptions.length > 0) {
          // Format a date to display
          const date = new Date(transcriptions[0].created_at);
          const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          
          tableData.rows.push([
            formattedDate,
            "Observation issue de transcription",
            "Haute"
          ]);
        }
        
        return tableData;
        
      default:
        return "Contenu non disponible";
    }
  },
  
  async saveReport(report: OfficialReport, profileId: string): Promise<string> {
    try {
      // In production, we would save this to a reports table
      console.log("Saving report:", report);
      
      // Mock implementation
      return "report-id-mock";
    } catch (error) {
      console.error("Error saving report:", error);
      throw error;
    }
  },
  
  async exportToPdf(reportId: string): Promise<Blob> {
    try {
      // In production, this would generate a PDF
      console.log("Exporting report to PDF:", reportId);
      
      // Mock implementation
      return new Blob(["PDF content"], { type: "application/pdf" });
    } catch (error) {
      console.error("Error exporting report:", error);
      throw error;
    }
  }
};
