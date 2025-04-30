
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { standardizedReportService } from '@/services/standardizedReportService';
import { StandardizedReport, ReportTemplate } from '@/types/casf';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';

interface UseStandardizedReportProps {
  profileId?: string;
  reportId?: string;
}

export function useStandardizedReport({ profileId, reportId }: UseStandardizedReportProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  
  // State for tracking loading states
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Fetch reports for a profile
  const {
    data: reports = [],
    isLoading: isLoadingReports,
    refetch: refetchReports
  } = useQuery({
    queryKey: ['standardized_reports', profileId],
    queryFn: () => standardizedReportService.getReportsByProfileId(profileId || ''),
    enabled: !!profileId,
  });
  
  // Fetch a single report
  const {
    data: report,
    isLoading: isLoadingReport,
    refetch: refetchReport
  } = useQuery({
    queryKey: ['standardized_report', reportId],
    queryFn: () => standardizedReportService.getReportById(reportId || ''),
    enabled: !!reportId,
  });
  
  // Fetch report templates
  const {
    data: templates = [],
    isLoading: isLoadingTemplates
  } = useQuery({
    queryKey: ['report_templates'],
    queryFn: () => standardizedReportService.getTemplates(),
  });
  
  // Create report mutation
  const createReportMutation = useMutation({
    mutationFn: (reportData: Omit<StandardizedReport, 'id' | 'created_at' | 'updated_at'>) => {
      setIsCreating(true);
      return standardizedReportService.createReport(reportData);
    },
    onSuccess: (data) => {
      toast({
        title: "Rapport créé",
        description: "Le rapport a été créé avec succès"
      });
      
      logAction('create', 'report', data.id, { title: data.title });
      
      if (profileId) {
        queryClient.invalidateQueries({ queryKey: ['standardized_reports', profileId] });
      }
      return data;
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du rapport",
        variant: "destructive"
      });
      console.error("Error creating report:", error);
    },
    onSettled: () => {
      setIsCreating(false);
    }
  });
  
  // Update report mutation
  const updateReportMutation = useMutation({
    mutationFn: ({ reportId, updates }: { 
      reportId: string, 
      updates: Partial<Omit<StandardizedReport, 'id' | 'created_at' | 'updated_at'>>
    }) => {
      setIsUpdating(true);
      return standardizedReportService.updateReport(reportId, updates);
    },
    onSuccess: (data) => {
      toast({
        title: "Rapport mis à jour",
        description: "Le rapport a été mis à jour avec succès"
      });
      
      logAction('update', 'report', data.id, { title: data.title });
      
      queryClient.invalidateQueries({ queryKey: ['standardized_report', data.id] });
      if (profileId) {
        queryClient.invalidateQueries({ queryKey: ['standardized_reports', profileId] });
      }
      return data;
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du rapport",
        variant: "destructive"
      });
      console.error("Error updating report:", error);
    },
    onSettled: () => {
      setIsUpdating(false);
    }
  });
  
  // Delete report mutation
  const deleteReportMutation = useMutation({
    mutationFn: (reportId: string) => {
      setIsDeleting(true);
      return standardizedReportService.deleteReport(reportId);
    },
    onSuccess: (_, deletedReportId) => {
      toast({
        title: "Rapport supprimé",
        description: "Le rapport a été supprimé avec succès"
      });
      
      logAction('delete', 'report', deletedReportId);
      
      if (profileId) {
        queryClient.invalidateQueries({ queryKey: ['standardized_reports', profileId] });
      }
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression du rapport",
        variant: "destructive"
      });
      console.error("Error deleting report:", error);
    },
    onSettled: () => {
      setIsDeleting(false);
    }
  });
  
  // Handle report operations
  const createReport = (reportData: Omit<StandardizedReport, 'id' | 'created_at' | 'updated_at'>) => {
    return createReportMutation.mutateAsync(reportData);
  };
  
  const updateReport = (reportId: string, updates: Partial<Omit<StandardizedReport, 'id' | 'created_at' | 'updated_at'>>) => {
    return updateReportMutation.mutateAsync({ reportId, updates });
  };
  
  const deleteReport = (reportId: string) => {
    return deleteReportMutation.mutateAsync(reportId);
  };
  
  return {
    // Data
    reports,
    report,
    templates,
    
    // Loading states
    isLoadingReports,
    isLoadingReport,
    isLoadingTemplates,
    isCreating,
    isUpdating,
    isDeleting,
    
    // Refetch methods
    refetchReports,
    refetchReport,
    
    // Report operations
    createReport,
    updateReport,
    deleteReport
  };
}
