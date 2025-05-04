
import { useState, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ReportMetadata, ReportResourceType, ReportTemplate } from "@/types/reports";
import { FileWithContent } from "@/types/note-generation";
import { useAuditLog } from "@/hooks/useAuditLog";

export interface UseUnifiedReportGenerationProps {
  profileId?: string;
  reportType: ReportResourceType;
  onSuccess?: () => void;
}

export interface SaveReportParams {
  title: string;
  content: string;
  metadata?: ReportMetadata;
}

export function useUnifiedReportGeneration({
  profileId,
  reportType,
  onSuccess,
}: UseUnifiedReportGenerationProps) {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  
  // State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [reportTitle, setReportTitle] = useState<string>(`Nouveau rapport ${new Date().toLocaleDateString("fr-FR")}`);
  const [reportData, setReportData] = useState<any>(null);
  const [reportMetadata, setReportMetadata] = useState<ReportMetadata>({
    periodStart: new Date().toISOString(),
    periodEnd: new Date().toISOString(),
    status: "draft",
  });
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  // Fetch template details when a template is selected
  const templateQuery = useQuery({
    queryKey: ['template_details', selectedTemplateId],
    queryFn: async () => {
      if (!selectedTemplateId) return null;
      
      // Fetch template
      const { data: template, error: templateError } = await supabase
        .from('templates')
        .select('*')
        .eq('id', selectedTemplateId)
        .single();
      
      if (templateError) throw templateError;
      
      // Fetch template sections
      const { data: sections, error: sectionsError } = await supabase
        .from('template_sections')
        .select('*')
        .eq('template_id', selectedTemplateId)
        .order('order_index');
      
      if (sectionsError) throw sectionsError;
      
      return {
        ...template,
        sections: sections || [],
      };
    },
    enabled: !!selectedTemplateId,
  });
  
  // Fetch files content when files are selected
  const filesContentQuery = useQuery({
    queryKey: ['files_content', selectedFiles],
    queryFn: async (): Promise<FileWithContent[]> => {
      if (!selectedFiles.length) return [];
      
      const filesWithContent: FileWithContent[] = [];
      
      for (const fileId of selectedFiles) {
        const { data: file, error: fileError } = await supabase
          .from('files')
          .select('*')
          .eq('id', fileId)
          .single();
        
        if (fileError) {
          console.error(`Error fetching file ${fileId}:`, fileError);
          continue;
        }
        
        filesWithContent.push({
          ...file,
          content: file.content || '',
        });
      }
      
      return filesWithContent;
    },
    enabled: selectedFiles.length > 0,
  });
  
  // Generate report content
  const generateReport = useCallback(async () => {
    setIsGenerating(true);
    
    try {
      let prompt = "";
      let templateStructure = null;
      
      // Add template information to the prompt if a template is selected
      if (selectedTemplateId && templateQuery.data) {
        templateStructure = {
          title: templateQuery.data.title,
          sections: templateQuery.data.sections.map((section: any) => ({
            title: section.title,
            instructions: section.instructions,
          })),
        };
        
        prompt += `Utiliser la structure de template suivante: ${JSON.stringify(templateStructure)}\n\n`;
      }
      
      // Add files content to the prompt if files are selected
      if (selectedFiles.length > 0 && filesContentQuery.data) {
        const filesContent = filesContentQuery.data.map(file => 
          `Contenu du fichier "${file.name}":\n${file.content || "Contenu non disponible"}`
        ).join("\n\n");
        
        prompt += `Analyser les fichiers suivants et générer un rapport:\n${filesContent}`;
      }
      
      if (!prompt) {
        throw new Error("Aucun contenu sélectionné pour la génération");
      }
      
      // Call AI service to generate content
      // For demonstration purposes, let's simulate AI generation
      // In a real app, this would be a call to an AI service like OpenAI
      const simulatedResponse = await new Promise<string>(resolve => {
        setTimeout(() => {
          // Create a simple report based on the reportType
          let content = "";
          if (templateStructure) {
            content = `# ${templateStructure.title}\n\n`;
            
            templateStructure.sections.forEach(section => {
              content += `## ${section.title}\n`;
              content += `${section.instructions ? 'Instructions: ' + section.instructions + '\n' : ''}`;
              content += `Contenu généré pour cette section basé sur ${selectedFiles.length} fichiers sélectionnés.\n\n`;
            });
          } else {
            content = `# Rapport généré\n\nCe rapport a été généré en analysant ${selectedFiles.length} fichiers sélectionnés.\n\n`;
            content += `Type de rapport: ${reportType}\n`;
            content += `Période: ${new Date(reportMetadata.periodStart || "").toLocaleDateString("fr-FR")} - ${new Date(reportMetadata.periodEnd || "").toLocaleDateString("fr-FR")}\n\n`;
            content += "## Contenu principal\n\n";
            content += "Contenu généré automatiquement basé sur l'analyse des documents.\n\n";
            content += "## Conclusion\n\n";
            content += "Conclusion du rapport généré automatiquement.\n\n";
          }
          
          resolve(content);
        }, 2000); // Simulate a 2-second delay
      });
      
      // Update state with generated content
      setGeneratedContent(simulatedResponse);
      
      // Update report title if it's still the default
      if (reportTitle.includes("Nouveau rapport")) {
        const newTitle = templateStructure 
          ? `${templateStructure.title} - ${new Date().toLocaleDateString("fr-FR")}` 
          : `Rapport ${reportType} - ${new Date().toLocaleDateString("fr-FR")}`;
        setReportTitle(newTitle);
      }
      
      toast({
        title: "Génération réussie",
        description: "Le contenu a été généré avec succès"
      });
      
      return simulatedResponse;
      
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Erreur de génération",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la génération du rapport",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [
    selectedTemplateId,
    selectedFiles,
    templateQuery.data,
    filesContentQuery.data,
    reportType,
    reportMetadata.periodStart,
    reportMetadata.periodEnd,
    reportTitle,
    toast
  ]);
  
  // Handle report generation initiation
  const handleGenerate = useCallback(async () => {
    if ((!selectedTemplateId && selectedFiles.length === 0) || isGenerating) {
      toast({
        title: "Sélection requise",
        description: "Veuillez sélectionner un template ou des fichiers sources",
        variant: "destructive"
      });
      return;
    }
    
    await generateReport();
  }, [generateReport, isGenerating, selectedFiles.length, selectedTemplateId, toast]);
  
  // Reset function to clear all state
  const handleReset = useCallback(() => {
    setSelectedTemplateId("");
    setSelectedFolders([]);
    setSelectedFiles([]);
    setGeneratedContent("");
    setReportTitle(`Nouveau rapport ${new Date().toLocaleDateString("fr-FR")}`);
    setReportData(null);
    setReportMetadata({
      periodStart: new Date().toISOString(),
      periodEnd: new Date().toISOString(),
      status: "draft",
    });
  }, []);
  
  // Save report mutation
  const saveReport = useMutation({
    mutationFn: async ({ title, content, metadata }: SaveReportParams) => {
      if (!content) {
        throw new Error("Le contenu du rapport ne peut pas être vide");
      }
      
      const reportData = {
        title,
        report_type: reportType,
        period_start: metadata?.periodStart || new Date().toISOString(),
        period_end: metadata?.periodEnd || new Date().toISOString(),
        content: {
          text: content,
          metadata: metadata || {},
        },
        user_id: (await supabase.auth.getUser()).data.user?.id || '00000000-0000-0000-0000-000000000000',
      };
      
      const { data, error } = await supabase
        .from('activity_reports')
        .insert(reportData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Rapport sauvegardé",
        description: "Le rapport a été sauvegardé avec succès"
      });
      
      logAction('create', 'report', data.id, { title: data.title });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      console.error("Error saving report:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde du rapport",
        variant: "destructive"
      });
    }
  });
  
  return {
    // State
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
    reportMetadata,
    setReportMetadata,
    isGenerating,
    
    // Actions
    handleGenerate,
    handleReset,
    saveReport,
    
    // Queries
    templateQuery,
    filesContentQuery,
  };
}
