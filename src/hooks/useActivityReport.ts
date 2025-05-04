
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activityReportService } from '@/services/activityReportService';
import { ActivityReport } from '@/types/casf';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';

interface UseActivityReportProps {
  reportId?: string;
  filters?: {
    report_type?: string;
    start_date?: string;
    end_date?: string;
  };
}

export function useActivityReport({ reportId, filters }: UseActivityReportProps = {}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  
  // State for tracking loading states
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Fetch all reports with optional filters
  const {
    data: reports = [],
    isLoading: isLoadingReports,
    refetch: refetchReports
  } = useQuery({
    queryKey: ['activity-reports', filters],
    queryFn: () => activityReportService.getReports(filters),
  });
  
  // Fetch a single report
  const {
    data: report,
    isLoading: isLoadingReport,
    refetch: refetchReport
  } = useQuery({
    queryKey: ['activity-report', reportId],
    queryFn: () => activityReportService.getReportById(reportId || ''),
    enabled: !!reportId,
  });
  
  // Create report mutation
  const createReportMutation = useMutation({
    mutationFn: (reportData: Omit<ActivityReport, 'id' | 'created_at'>) => {
      setIsCreating(true);
      return activityReportService.createReport(reportData);
    },
    onSuccess: (data) => {
      toast({
        title: "Rapport créé",
        description: "Le rapport a été créé avec succès"
      });
      
      logAction('create', 'activity_report', data.id, { title: data.title });
      queryClient.invalidateQueries({ queryKey: ['activity-reports'] });
      
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
      updates: Partial<Omit<ActivityReport, 'id' | 'user_id' | 'created_at'>>
    }) => {
      setIsUpdating(true);
      return activityReportService.updateReport(reportId, updates);
    },
    onSuccess: (data) => {
      toast({
        title: "Rapport mis à jour",
        description: "Le rapport a été mis à jour avec succès"
      });
      
      logAction('update', 'activity_report', data.id, { title: data.title });
      queryClient.invalidateQueries({ queryKey: ['activity-report', data.id] });
      queryClient.invalidateQueries({ queryKey: ['activity-reports'] });
      
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
      return activityReportService.deleteReport(reportId);
    },
    onSuccess: (_, deletedReportId) => {
      toast({
        title: "Rapport supprimé",
        description: "Le rapport a été supprimé avec succès"
      });
      
      logAction('delete', 'activity_report', deletedReportId);
      queryClient.invalidateQueries({ queryKey: ['activity-reports'] });
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
  const createReport = (reportData: Omit<ActivityReport, 'id' | 'created_at'>) => {
    return createReportMutation.mutateAsync(reportData);
  };
  
  const updateReport = (reportId: string, updates: Partial<Omit<ActivityReport, 'id' | 'user_id' | 'created_at'>>) => {
    return updateReportMutation.mutateAsync({ reportId, updates });
  };
  
  const deleteReport = (reportId: string) => {
    return deleteReportMutation.mutateAsync(reportId);
  };
  
  return {
    // Data
    reports,
    report,
    
    // Loading states
    isLoadingReports,
    isLoadingReport,
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
