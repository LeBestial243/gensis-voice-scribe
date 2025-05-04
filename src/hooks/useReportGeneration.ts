
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reportService } from '@/services/reportService';
import { ReportType } from '@/types/reports';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from './useAuditLog';

export interface GenerateReportParams {
  title: string;
  reportType: ReportType;
  periodStart: string;
  periodEnd: string;
  content?: Record<string, any>;
  userId: string;
}

export function useReportGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();
  
  const reportMutation = useMutation({
    mutationFn: (params: GenerateReportParams) => {
      setIsGenerating(true);
      
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
      
      return reportService.createReport(reportData);
    },
    onSuccess: (data) => {
      toast({
        title: "Rapport généré",
        description: "Le rapport a été généré avec succès."
      });
      
      // Log audit event
      logAction('create', 'report', data.id, { title: data.title });
      
      // Invalidate reports query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (error) => {
      console.error("Error generating report:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la génération du rapport.",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsGenerating(false);
    }
  });
  
  const generateReport = (params: GenerateReportParams) => {
    return reportMutation.mutateAsync(params);
  };
  
  return {
    generateReport,
    isGenerating,
    error: reportMutation.error
  };
}
