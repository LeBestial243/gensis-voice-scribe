
import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ReportMetadata, StandardizedReportType, ReportSection } from '@/types/reports';

interface UseReportGenerationProps {
  profileId?: string;
  reportType?: StandardizedReportType;
  onSuccess?: () => void;
}

export function useReportGeneration({
  profileId,
  reportType = 'note',
  onSuccess
}: UseReportGenerationProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Selection state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  
  // Report content state
  const [reportTitle, setReportTitle] = useState<string>('');
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [reportData, setReportData] = useState<Record<string, any>>({});
  const [reportMetadata, setReportMetadata] = useState<ReportMetadata>({
    period_start: new Date().toISOString(),
    period_end: new Date().toISOString(),
  });
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Reset all state
  const handleReset = useCallback(() => {
    setSelectedTemplateId('');
    setSelectedFolders([]);
    setSelectedFiles([]);
    setReportTitle('');
    setGeneratedContent('');
    setReportData({});
    setReportMetadata({
      period_start: new Date().toISOString(),
      period_end: new Date().toISOString(),
    });
    setIsGenerating(false);
  }, []);

  // Generate report content
  const handleGenerate = useCallback(async () => {
    if ((!selectedTemplateId && selectedFiles.length === 0)) {
      toast({
        title: 'Sélection incomplète',
        description: 'Veuillez sélectionner un template ou des fichiers pour générer un rapport.',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);

    try {
      // In a real implementation, this would call your AI report generation API
      // Mocking the generation for now
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const title = selectedTemplateId 
        ? `Rapport généré depuis un template (${new Date().toLocaleDateString('fr-FR')})`
        : `Rapport basé sur ${selectedFiles.length} document(s) (${new Date().toLocaleDateString('fr-FR')})`;
      
      setReportTitle(title);
      
      // Simulate AI generated content
      const generatedText = 
        `# ${title}\n\n` +
        `## Introduction\n\n` +
        `Ce rapport a été généré automatiquement le ${new Date().toLocaleDateString('fr-FR')}.\n\n` +
        `## Analyse\n\n` +
        `L'analyse des documents sélectionnés a révélé les informations suivantes...\n\n` +
        `## Conclusion\n\n` +
        `En conclusion, les données montrent...\n\n`;
      
      setGeneratedContent(generatedText);
      
      // Set sample report data
      setReportData({
        sections: [
          { title: 'Introduction', content: 'Ce rapport a été généré automatiquement.' },
          { title: 'Analyse', content: 'L\'analyse des documents sélectionnés a révélé les informations suivantes...' },
          { title: 'Conclusion', content: 'En conclusion, les données montrent...' }
        ]
      });
      
      toast({
        title: 'Rapport généré',
        description: 'Votre rapport a été généré avec succès'
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Erreur de génération',
        description: 'Une erreur est survenue lors de la génération du rapport',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  }, [selectedTemplateId, selectedFiles, toast]);

  // Save report
  const saveReport = useMutation({
    mutationFn: async ({ 
      title, 
      content, 
      metadata 
    }: { 
      title: string; 
      content: string;
      metadata?: ReportMetadata;
    }) => {
      // Determine which table to save to based on report type
      let tableName: 'activity_reports' | 'notes' = 'notes';
      let reportData: any = {};
      
      switch(reportType) {
        case 'activity':
          tableName = 'activity_reports';
          reportData = {
            title,
            report_type: 'custom',
            period_start: metadata?.period_start || new Date().toISOString(),
            period_end: metadata?.period_end || new Date().toISOString(),
            user_id: (await supabase.auth.getUser()).data.user?.id,
            content: {
              sections: [{ title: 'Content', content }],
              metadata
            }
          };
          break;
          
        case 'standardized':
        case 'evaluation':
        case 'note':
        default:
          tableName = 'notes';
          reportData = {
            title,
            content,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            confidentiality_level: metadata?.confidentiality_level || 'public'
          };
          break;
      }
      
      const { data, error } = await supabase
        .from(tableName as any)
        .insert(reportData)
        .select()
        .single();
        
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Rapport sauvegardé',
        description: 'Votre rapport a été sauvegardé avec succès'
      });
      
      // Refresh related queries
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      console.error('Error saving report:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la sauvegarde',
        variant: 'destructive'
      });
    }
  });

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
    reportMetadata,
    setReportMetadata,
    isGenerating,
    handleGenerate,
    handleReset,
    saveReport
  };
}
