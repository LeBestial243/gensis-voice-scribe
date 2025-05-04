
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from './useAuditLog';
import { StandardizedReport, ActivityReport, ReportType } from '@/types/casf';

interface UseReportGenerationProps {
  profileId?: string;
  reportType: "activity" | "standardized";
  onSuccess?: () => void;
}

export interface GenerateReportParams {
  title: string;
  reportType: ReportType;
  periodStart: string;
  periodEnd: string;
  content?: Record<string, any>;
  userId: string;
}

export function useReportGeneration({
  profileId,
  reportType,
  onSuccess
}: UseReportGenerationProps = { reportType: "activity" }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [reportTitle, setReportTitle] = useState<string>("Nouveau rapport");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [reportData, setReportData] = useState<Partial<ActivityReport | StandardizedReport>>({});

  const saveReport = useMutation({
    mutationFn: async (data: Partial<ActivityReport | StandardizedReport>) => {
      // Vérifier les champs requis
      if (!data.title) {
        throw new Error("Le titre est requis");
      }

      try {
        // For activity reports only - standardized reports would use a different implementation
        if (reportType === "activity") {
          const activityReportData: Partial<ActivityReport> = {
            title: data.title,
            report_type: (data as Partial<ActivityReport>).report_type || 'monthly',
            period_start: (data as Partial<ActivityReport>).period_start || new Date().toISOString(),
            period_end: (data as Partial<ActivityReport>).period_end || new Date().toISOString(),
            user_id: (data as Partial<ActivityReport>).user_id || 'system',
            content: data.content || {}
          };
          
          // Si un ID existe, mettre à jour le rapport existant
          if (data.id) {
            const { data: updatedData, error } = await supabase
              .from('activity_reports')
              .update(activityReportData)
              .eq("id", data.id)
              .select()
              .single();
              
            if (error) throw error;
            return updatedData;
          } 
          // Sinon, créer un nouveau rapport
          else {
            const { data: newData, error } = await supabase
              .from('activity_reports')
              .insert(activityReportData)
              .select()
              .single();
              
            if (error) throw error;
            return newData;
          }
        } else {
          // For standardized reports, we would implement a different approach
          // This is a mock implementation since the table doesn't exist
          console.log("Creating standardized report:", data);
          return {
            id: `mock-${Date.now()}`,
            ...data,
            created_at: new Date().toISOString()
          };
        }
      } catch (error) {
        console.error("Erreur lors de l'enregistrement du rapport:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Rapport enregistré",
        description: "Votre rapport a été enregistré avec succès"
      });
      
      // Log audit event
      logAction('create', reportType === "activity" ? 'activity_report' : 'standardized_report', data.id, { title: data.title });
      
      // Invalidate reports query to refresh the list
      queryClient.invalidateQueries({ queryKey: [reportType === "activity" ? 'activity-reports' : 'standardized-reports'] });
      
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Une erreur est survenue lors de l'enregistrement: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleGenerate = async () => {
    if (!selectedTemplateId || (selectedFolders.length === 0 && selectedFiles.length === 0)) {
      toast({
        title: "Sélection incomplète",
        description: "Veuillez sélectionner un template et au moins un dossier ou fichier",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Récupérer le contenu des fichiers sélectionnés
      const { data: templateData, error: templateError } = await supabase
        .from("templates")
        .select("*")
        .eq("id", selectedTemplateId)
        .single();
        
      if (templateError) throw templateError;

      // Récupérer les sections du template
      const { data: sectionData, error: sectionError } = await supabase
        .from("template_sections")
        .select("*")
        .eq("template_id", selectedTemplateId)
        .order("order_index");
        
      if (sectionError) throw sectionError;

      // Récupérer le contenu des fichiers sélectionnés
      const { data: fileContents, error: fileError } = await supabase
        .from("files")
        .select("id, name, content")
        .in("id", selectedFiles);
        
      if (fileError) throw fileError;

      // Simuler un délai pour l'IA
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Créer des sections basées sur le template
      let sections = [];
      
      if (sectionData && sectionData.length > 0) {
        sections = sectionData.map(section => ({
          title: section.title,
          content: `Contenu généré par IA pour la section "${section.title}" basé sur ${selectedFiles.length} document(s) sélectionné(s).

${fileContents && fileContents.length > 0 
  ? 'Documents analysés: ' + fileContents.map(f => f.name).join(', ')
  : 'Aucun contenu de document disponible.'}`,
          type: "text"
        }));
      } else {
        // Section par défaut
        sections = [
          { 
            title: "Résumé", 
            content: `Résumé généré par IA basé sur ${selectedFiles.length} document(s) sélectionné(s).`,
            type: "text" 
          }
        ];
      }

      // Préparer les données du rapport
      const newReportData: Partial<ActivityReport | StandardizedReport> = {
        title: templateData?.title || "Nouveau rapport",
        report_type: reportType === "activity" ? "monthly" : "evaluation",
        content: {
          sections,
          ...(reportType === "activity" 
            ? { metrics: [] } 
            : { template_id: selectedTemplateId })
        }
      };

      // Ajouter les champs spécifiques selon le type de rapport
      if (reportType === "activity") {
        (newReportData as Partial<ActivityReport>).period_start = new Date().toISOString();
        (newReportData as Partial<ActivityReport>).period_end = new Date().toISOString();
      } else if (reportType === "standardized") {
        (newReportData as Partial<StandardizedReport>).profile_id = profileId;
        (newReportData as Partial<StandardizedReport>).confidentiality_level = "restricted";
      }

      setReportData(newReportData);
      setReportTitle(newReportData.title || "Nouveau rapport");

      // Convertir les sections en texte pour l'éditeur
      const contentText = sections.map(section => 
        `# ${section.title}\n\n${section.content}\n\n`
      ).join('');

      setGeneratedContent(contentText);

      toast({
        title: "Génération réussie",
        description: "Le contenu a été généré avec succès"
      });
    } catch (error) {
      console.error("Erreur lors de la génération:", error);
      toast({
        title: "Erreur de génération",
        description: `Une erreur est survenue: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setSelectedTemplateId("");
    setSelectedFolders([]);
    setSelectedFiles([]);
    setGeneratedContent("");
    setReportTitle("Nouveau rapport");
    setReportData({});
  };

  const parseSectionsFromContent = (content: string) => {
    try {
      const sectionRegex = /^# (.+)$([\s\S]*?)(?=^# |$)/gm;
      const sections = [];
      let match;
      
      while ((match = sectionRegex.exec(content + '\n# '))) {
        const title = match[1].trim();
        const sectionContent = match[2].trim();
        
        sections.push({
          title,
          content: sectionContent,
          type: "text"
        });
      }
      
      return sections;
    } catch (e) {
      console.error("Erreur lors du parsing du contenu:", e);
      return [];
    }
  };

  // Add a simplified version for direct generation without template/files selection
  const generateReport = async (params: GenerateReportParams) => {
    setIsGenerating(true);
    
    try {
      const reportData = {
        title: params.title,
        report_type: params.reportType,
        period_start: params.periodStart,
        period_end: params.periodEnd,
        user_id: params.userId,
        content: params.content || {
          sections: [
            {
              title: "Vue d'ensemble",
              content: `Ce rapport couvre la période du ${new Date(params.periodStart).toLocaleDateString('fr-FR')} au ${new Date(params.periodEnd).toLocaleDateString('fr-FR')}.`,
              type: "text"
            }
          ],
          metadata: {
            generated: new Date().toISOString(),
            automated: params.content ? false : true
          }
        }
      };
      
      const { data, error } = await supabase
        .from('activity_reports')
        .insert(reportData)
        .select()
        .single();
        
      if (error) throw error;
      
      // Log audit event
      logAction('create', 'report', data.id, { title: data.title });
      
      // Invalidate reports query
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      
      toast({
        title: "Rapport généré",
        description: "Le rapport a été généré avec succès"
      });
      
      return data;
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la génération du rapport",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    selectedTemplateId,
    setSelectedTemplateId,
    selectedFolders,
    setSelectedFolders,
    selectedFiles,
    setSelectedFiles,
    generatedContent,
    setGeneratedContent,
    reportTitle,
    setReportTitle,
    reportData,
    setReportData,
    isGenerating,
    handleGenerate,
    generateReport,
    handleReset,
    saveReport,
    parseSectionsFromContent
  };
}
