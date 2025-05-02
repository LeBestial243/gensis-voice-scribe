
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { officialReportService, GenerateReportParams } from "@/services/officialReportService";
import { useToast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/utils/errorHandler";
import { OfficialReport } from "@/types/reports";

interface UseOfficialReportProps {
  profileId: string;
}

export function useOfficialReport({ profileId }: UseOfficialReportProps) {
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  
  // State for report generation
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [periodStart, setPeriodStart] = useState<Date>(
    new Date(new Date().setMonth(new Date().getMonth() - 3))
  );
  const [periodEnd, setPeriodEnd] = useState<Date>(new Date());
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeTranscriptions, setIncludeTranscriptions] = useState(true);
  const [customInstructions, setCustomInstructions] = useState("");
  const [generatedReport, setGeneratedReport] = useState<Record<string, any> | null>(null);
  
  // Fetch available report templates
  const {
    data: templates = [],
    isLoading: isLoadingTemplates
  } = useQuery({
    queryKey: ['report_templates'],
    queryFn: () => officialReportService.getReportTemplates(),
  });
  
  // Fetch existing reports for this profile
  const {
    data: existingReports = [],
    isLoading: isLoadingReports,
    refetch: refetchReports
  } = useQuery({
    queryKey: ['official_reports', profileId],
    queryFn: () => officialReportService.getReportsByProfileId(profileId),
    enabled: !!profileId,
  });
  
  // Generate report mutation
  const generateMutation = useMutation({
    mutationFn: (params: GenerateReportParams) => 
      officialReportService.generateReport(params),
    onSuccess: (data) => {
      setGeneratedReport(data);
      toast({
        title: "Rapport généré",
        description: "Le rapport a été généré avec succès"
      });
    },
    onError: (error) => {
      handleError(error, "Génération du rapport");
    }
  });
  
  // Save report mutation
  const saveMutation = useMutation({
    mutationFn: (report: Record<string, any>) => 
      officialReportService.saveReport(report, profileId),
    onSuccess: () => {
      toast({
        title: "Rapport sauvegardé",
        description: "Le rapport a été sauvegardé avec succès"
      });
      refetchReports();
    },
    onError: (error) => {
      handleError(error, "Sauvegarde du rapport");
    }
  });
  
  // Export PDF mutation
  const exportMutation = useMutation({
    mutationFn: (reportId: string) => 
      officialReportService.exportToPdf(reportId),
    onSuccess: (pdfBlob) => {
      // Create download link for the PDF
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rapport-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export réussi",
        description: "Le rapport a été exporté en PDF"
      });
    },
    onError: (error) => {
      handleError(error, "Export du rapport");
    }
  });
  
  // Handle report generation
  const handleGenerateReport = (params: GenerateReportParams) => {
    return generateMutation.mutateAsync(params);
  };
  
  // Handle report saving
  const handleSaveReport = (report: Record<string, any>) => {
    return saveMutation.mutateAsync(report);
  };
  
  // Handle PDF export
  const handleExportPdf = (reportId: string) => {
    return exportMutation.mutateAsync(reportId);
  };
  
  return {
    // Data
    templates,
    existingReports,
    generatedReport,
    
    // State
    selectedTemplateId,
    periodStart,
    periodEnd,
    includeNotes,
    includeTranscriptions,
    customInstructions,
    
    // State setters
    setSelectedTemplateId,
    setPeriodStart,
    setPeriodEnd,
    setIncludeNotes,
    setIncludeTranscriptions,
    setCustomInstructions,
    setGeneratedReport,
    
    // Loading states
    isLoadingTemplates,
    isLoadingReports,
    isGenerating: generateMutation.isPending,
    isSaving: saveMutation.isPending,
    isExporting: exportMutation.isPending,
    
    // Actions
    handleGenerateReport,
    handleSaveReport,
    handleExportPdf,
    refetchReports
  };
}
