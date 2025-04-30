
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { StandardizedReportForm } from '@/components/casf/reports/StandardizedReportForm';
import { ReportPreview } from '@/components/casf/reports/ReportPreview';
import { ActivityReportGenerator } from '@/components/casf/activity/ActivityReportGenerator';
import { useActivityReport } from '@/hooks/useActivityReport';
import { useStandardizedReport } from '@/hooks/useStandardizedReport';
import { ActivityReport, StandardizedReport } from '@/types/casf';
import { AuditLogViewer } from '@/components/casf/confidentiality/AuditLogViewer';
import { ActivityStatistics } from '@/components/casf/activity/ActivityStatistics';
import { useToast } from '@/hooks/use-toast';
import { usePagination } from '@/hooks/usePagination';
import { CustomPagination } from '@/components/CustomPagination';
import { auditService } from '@/services/auditService';
import { activityReportService } from '@/services/activityReportService';
import { Loader2, Search, FileText, Calendar, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';

export default function CASFReportsPage() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('list');
  const [reportTypeFilter, setReportTypeFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<ActivityReport | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const { reports: activityReports = [], isLoadingReports } = useActivityReport({
    filters: reportTypeFilter ? { report_type: reportTypeFilter } : undefined
  });

  // In the real app, this would be based on a selected profile
  const mockProfileId = "mock-profile-id";
  const { createReport: createStandardizedReport, isCreating: isCreatingReport } = useStandardizedReport({ 
    profileId: mockProfileId 
  });
  
  const { data: auditLogs = [], isLoading: isLoadingAuditLogs } = useQuery({
    queryKey: ['audit-logs', 'report'],
    queryFn: () => auditService.getAuditLogs({ 
      resourceType: 'report'
    }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Filter reports based on search query
  const filteredReports = activityReports.filter(report => {
    if (!searchQuery) return true;
    return report.title.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  // Pagination for reports
  const {
    paginatedItems: paginatedReports,
    currentPage,
    setCurrentPage,
    totalPages
  } = usePagination({
    items: filteredReports,
    pageSize: 12,
    initialPage: 1
  });
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };
  
  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'monthly': return 'Mensuel';
      case 'quarterly': return 'Trimestriel';
      case 'yearly': return 'Annuel';
      case 'custom': return 'Personnalisé';
      default: return type;
    }
  };

  const handleCreateReport = async (data: Omit<StandardizedReport, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await createStandardizedReport(data);
      
      toast({
        title: "Rapport créé",
        description: "Le rapport a été créé avec succès"
      });
      
      setSelectedTab('list');
      return data as StandardizedReport;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du rapport",
        variant: "destructive"
      });
      throw error;
    }
  };
  
  const viewReport = async (reportId: string) => {
    try {
      // For now, we'll just use our activity report service since that's what we have implemented
      const report = await activityReportService.getReportById(reportId);
      setSelectedReport(report);
      setIsPreviewOpen(true);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du chargement du rapport",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto py-8 pb-24">
      <h1 className="text-3xl font-bold mb-6">Rapports CASF</h1>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Liste des rapports</TabsTrigger>
          <TabsTrigger value="create">Créer un rapport</TabsTrigger>
          <TabsTrigger value="activity">Activité</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un rapport..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={reportTypeFilter || undefined} onValueChange={(value) => setReportTypeFilter(value || null)}>
              <SelectTrigger className="w-[180px] shrink-0">
                <SelectValue placeholder="Type de rapport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="monthly">Mensuel</SelectItem>
                <SelectItem value="quarterly">Trimestriel</SelectItem>
                <SelectItem value="yearly">Annuel</SelectItem>
                <SelectItem value="custom">Personnalisé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {isLoadingReports ? (
            <div className="flex justify-center items-center h-60">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : paginatedReports.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-60">
                <FileText className="h-16 w-16 text-muted-foreground/30" />
                <p className="mt-4 text-lg font-medium">Aucun rapport trouvé</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery || reportTypeFilter 
                    ? "Essayez de modifier vos critères de recherche" 
                    : "Commencez par créer un nouveau rapport"}
                </p>
                {!searchQuery && !reportTypeFilter && (
                  <Button 
                    className="mt-4" 
                    onClick={() => setSelectedTab('create')}
                  >
                    Créer un rapport
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedReports.map((report) => (
                  <Card key={report.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="truncate text-lg">{report.title}</CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {formatDate(report.period_start)} - {formatDate(report.period_end)}
                          </span>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3 pt-0">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          Type: {getReportTypeLabel(report.report_type)}
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => viewReport(report.id)}
                          className="hover:bg-primary/10"
                        >
                          <Eye className="h-4 w-4 mr-1" /> Voir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <CustomPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </TabsContent>
        
        <TabsContent value="create" className="mt-6 space-y-6">
          <StandardizedReportForm 
            profileId={mockProfileId}
            onSubmit={handleCreateReport}
            isLoading={isCreatingReport}
          />
        </TabsContent>
        
        <TabsContent value="activity" className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityReportGenerator />
          
          <div className="space-y-6">
            <ActivityStatistics logs={auditLogs} title="Statistiques des activités" />
            
            <Card>
              <CardHeader>
                <CardTitle>Journal des activités récentes</CardTitle>
              </CardHeader>
              <CardContent>
                <AuditLogViewer resourceType="report" maxItems={5} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Aperçu du rapport</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <ReportPreview report={selectedReport} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
