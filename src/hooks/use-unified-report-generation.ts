
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { reportService } from '@/services/reportService';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLog } from './useAuditLog';
import { ReportMetadata } from '@/types/reports';
import { format } from 'date-fns';

export interface UnifiedReportGenerationParams {
  profileId?: string;
  reportType: string;
  onSuccess?: () => void;
}

export function useReportGeneration({ profileId, reportType, onSuccess }: UnifiedReportGenerationParams) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [reportTitle, setReportTitle] = useState<string>(`Rapport ${reportType} - ${format(new Date(), 'dd/MM/yyyy')}`);
  const [reportData, setReportData] = useState<any>({});
  const [reportMetadata, setReportMetadata] = useState<ReportMetadata>({
    type: '',
    periodStart: format(new Date(), 'yyyy-MM-dd'),
    periodEnd: format(new Date(), 'yyyy-MM-dd'),
  });
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  const handleGenerate = async () => {
    if ((!selectedTemplateId && selectedFiles.length === 0) || isGenerating) {
      return;
    }

    setIsGenerating(true);

    try {
      let content = '';
      
      // Use template-based generation if a template is selected
      if (selectedTemplateId) {
        const { data: template, error: templateError } = await supabase
          .from('templates')
          .select('*')
          .eq('id', selectedTemplateId)
          .single();
          
        if (templateError) throw templateError;

        // Get template sections
        const { data: sections, error: sectionsError } = await supabase
          .from('template_sections')
          .select('*')
          .eq('template_id', selectedTemplateId)
          .order('order_index');

        if (sectionsError) throw sectionsError;

        // Generate initial title based on template
        setReportTitle(`${template.title} - ${format(new Date(), 'dd/MM/yyyy')}`);
        
        // Start building content based on template
        content = `# ${template.title}\n\n`;

        // Add metadata
        if (reportMetadata.type) {
          content += `**Type**: ${reportMetadata.type}\n\n`;
        }
        
        if (reportMetadata.periodStart && reportMetadata.periodEnd) {
          content += `**Période**: du ${new Date(reportMetadata.periodStart).toLocaleDateString()} au ${new Date(reportMetadata.periodEnd).toLocaleDateString()}\n\n`;
        }
        
        // Add content for each section
        for (const section of sections || []) {
          content += `## ${section.title}\n\n`;
          content += `${section.description || 'Contenu à générer pour cette section...'}\n\n`;
        }
      } 
      // File-based generation
      else if (selectedFiles.length > 0) {
        // Fetch file data for selected files
        const filePromises = selectedFiles.map(async (fileId) => {
          const { data, error } = await supabase
            .from('files')
            .select('*')
            .eq('id', fileId)
            .single();
            
          if (error) throw error;
          return data;
        });
        
        const files = await Promise.all(filePromises);
        
        // Generate report from files
        content = `# Rapport de synthèse\n\n`;
        
        // Add metadata
        if (reportMetadata.type) {
          content += `**Type**: ${reportMetadata.type}\n\n`;
        }
        
        if (reportMetadata.periodStart && reportMetadata.periodEnd) {
          content += `**Période**: du ${new Date(reportMetadata.periodStart).toLocaleDateString()} au ${new Date(reportMetadata.periodEnd).toLocaleDateString()}\n\n`;
        }
        
        // Add section for each file
        for (const file of files) {
          content += `## ${file.name}\n\n`;
          content += `Contenu généré à partir du fichier "${file.name}"...\n\n`;
        }

        // Generate title based on files
        if (files.length === 1) {
          setReportTitle(`Synthèse de ${files[0].name} - ${format(new Date(), 'dd/MM/yyyy')}`);
        } else {
          setReportTitle(`Synthèse de ${files.length} fichiers - ${format(new Date(), 'dd/MM/yyyy')}`);
        }
      }
      
      // Set the generated content
      setGeneratedContent(content);
      
      toast({
        title: 'Contenu généré',
        description: 'Vous pouvez maintenant éditer le contenu généré'
      });
      
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la génération du rapport',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setSelectedTemplateId(null);
    setSelectedFolders([]);
    setSelectedFiles([]);
    setGeneratedContent('');
    setReportTitle(`Rapport ${reportType} - ${format(new Date(), 'dd/MM/yyyy')}`);
    setReportData({});
    setReportMetadata({
      type: '',
      periodStart: format(new Date(), 'yyyy-MM-dd'),
      periodEnd: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  // Save report mutation based on report type
  const saveReport = useMutation({
    mutationFn: async (params: { title: string, content: string, metadata: ReportMetadata }) => {
      let data;
      
      switch (reportType) {
        case 'activity':
          data = await reportService.createReport({
            title: params.title,
            report_type: params.metadata.type || 'custom',
            period_start: params.metadata.periodStart || format(new Date(), 'yyyy-MM-dd'),
            period_end: params.metadata.periodEnd || format(new Date(), 'yyyy-MM-dd'),
            content: { sections: [{ title: 'Contenu', content: params.content }] },
            user_id: profileId || '',
          });
          break;
          
        case 'note':
          // Handle note type report
          const { data: noteData, error } = await supabase
            .from('notes')
            .insert({
              title: params.title,
              content: params.content,
              type: params.metadata.type || 'general',
              period_start: params.metadata.periodStart,
              period_end: params.metadata.periodEnd,
              user_id: profileId
            })
            .select()
            .single();
            
          if (error) throw error;
          data = noteData;
          break;
          
        // Add other report types as needed
          
        default:
          throw new Error(`Unsupported report type: ${reportType}`);
      }
      
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Rapport sauvegardé',
        description: 'Le rapport a été sauvegardé avec succès'
      });
      
      // Log audit event
      logAction('create', reportType, data.id, { title: data.title });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [reportType + 's'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      
      // Call onSuccess callback
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      console.error('Error saving report:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la sauvegarde du rapport',
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
    saveReport,
  };
}
