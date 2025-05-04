
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ReportMetadata, ReportResourceType } from '@/types/reports';

export interface UseReportGenerationOptions {
  profileId?: string;
  reportType?: ReportResourceType;
  onSuccess?: () => void;
}

export const useUnifiedReportGeneration = ({ 
  profileId,
  reportType = 'note',
  onSuccess 
}: UseReportGenerationOptions) => {
  const { toast } = useToast();
  
  // State for template selection
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  
  // State for source selection
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  
  // State for report content
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [reportTitle, setReportTitle] = useState<string>(`Nouveau rapport ${reportType}`);
  const [reportData, setReportData] = useState<any>(null);
  
  // State for report metadata
  const [reportMetadata, setReportMetadata] = useState<ReportMetadata>({
    periodStart: new Date().toISOString(),
    periodEnd: new Date().toISOString(),
    reportType,
    status: 'draft'
  });
  
  // State for generation
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  // Generate report function
  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      
      // Dummy content generation for now
      // In a real application, this would call an AI service or backend
      setTimeout(() => {
        const sampleContent = `# ${reportTitle || 'Nouveau rapport'}\n\n` +
          `## Période: ${new Date(reportMetadata.periodStart || '').toLocaleDateString('fr-FR')} - ` +
          `${new Date(reportMetadata.periodEnd || '').toLocaleDateString('fr-FR')}\n\n` +
          `### Introduction\n` +
          `Ce rapport a été généré ${selectedTemplateId ? 'à partir d\'un modèle' : 'à partir de fichiers sources'}.\n\n` +
          `### Contenu\n` +
          `Le contenu serait généré par IA à partir des documents sources sélectionnés.\n\n` +
          `### Conclusion\n` +
          `Ceci est un exemple de rapport généré. Dans une implémentation réelle, le contenu serait généré par un appel à une API d'IA.`;
          
        setGeneratedContent(sampleContent);
        setIsGenerating(false);
      }, 1500);
      
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la génération du rapport.",
        variant: "destructive"
      });
      setIsGenerating(false);
    }
  };
  
  // Save report
  const saveReport = useMutation({
    mutationFn: async (data: { 
      title: string;
      content: string;
      metadata: ReportMetadata;
    }) => {
      // Check required fields
      if (!data.title || !data.content) {
        throw new Error("Titre et contenu requis");
      }
      
      const { data: savedReport, error } = await supabase
        .from('reports')
        .insert({
          title: data.title,
          content: data.content,
          metadata: data.metadata,
          profile_id: profileId || null,
          report_type: reportType,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return savedReport;
    },
    onSuccess: () => {
      toast({
        title: "Rapport sauvegardé",
        description: "Le rapport a été sauvegardé avec succès."
      });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      console.error("Error saving report:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde du rapport.",
        variant: "destructive"
      });
    }
  });
  
  // Reset all state
  const handleReset = () => {
    setSelectedTemplateId('');
    setSelectedFolders([]);
    setSelectedFiles([]);
    setGeneratedContent('');
    setReportTitle(`Nouveau rapport ${reportType}`);
    setReportData(null);
    setReportMetadata({
      periodStart: new Date().toISOString(),
      periodEnd: new Date().toISOString(),
      reportType,
      status: 'draft'
    });
  };
  
  return {
    // Template selection
    selectedTemplateId,
    setSelectedTemplateId,
    
    // Source selection
    selectedFolders,
    setSelectedFolders,
    selectedFiles,
    setSelectedFiles,
    
    // Report content
    generatedContent,
    setGeneratedContent,
    reportTitle,
    setReportTitle,
    reportData,
    setReportData,
    
    // Report metadata
    reportMetadata,
    setReportMetadata,
    
    // Actions
    isGenerating,
    handleGenerate,
    handleReset,
    saveReport,
  };
};
