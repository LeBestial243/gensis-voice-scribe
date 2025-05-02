
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon, FileDigit, FileCheck, Download, Printer } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { jsPDF } from 'jspdf';
import { useOfficialReport } from '@/hooks/useOfficialReport';
import type { OfficialReport } from '@/types/reports';

type ReportTypeOption = {
  id: string;
  label: string;
  description: string;
};

const reportTypes: ReportTypeOption[] = [
  { 
    id: 'social_services', 
    label: 'Services Sociaux', 
    description: 'Rapport pour les services sociaux détaillant le suivi et les progrès réalisés.' 
  },
  { 
    id: 'court', 
    label: 'Tribunal', 
    description: 'Rapport destiné au juge pour enfants ou au tribunal familial.' 
  },
  { 
    id: 'school', 
    label: 'École', 
    description: 'Rapport pour établissement scolaire concernant le comportement et les adaptations.' 
  },
  { 
    id: 'medical', 
    label: 'Médical', 
    description: 'Rapport pour professionnels de santé concernant les aspects psychologiques et comportementaux.' 
  },
  { 
    id: 'status_update', 
    label: 'Bilan périodique', 
    description: 'Bilan complet sur une période donnée pour l\'ensemble des parties prenantes.' 
  },
];

export function OfficialReportGenerator() {
  const { profileId } = useParams<{ profileId: string }>();
  const [reportType, setReportType] = useState<string>("social_services");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [activeReport, setActiveReport] = useState<OfficialReport | null>(null);
  const [activeTab, setActiveTab] = useState<string>("settings");
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { generateReport, saveReport, getReportHistory, exportReportPdf } = useOfficialReport();
  
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['young_profile', profileId],
    queryFn: async () => {
      if (!profileId) throw new Error('ID de profil manquant');
      
      const { data, error } = await supabase
        .from('young_profiles')
        .select('*')
        .eq('id', profileId)
        .single();
        
      if (error) {
        toast({
          title: "Erreur de chargement",
          description: `Impossible de charger le profil: ${error.message}`,
          variant: "destructive"
        });
        throw error;
      }
      return data;
    },
    enabled: !!profileId,
  });
  
  const { data: reportHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['report_history', profileId],
    queryFn: () => getReportHistory(profileId!),
    enabled: !!profileId,
  });
  
  const handleTypeChange = (value: string) => {
    setReportType(value);
  };
  
  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
  };
  
  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
  };
  
  const handleGenerateReport = async () => {
    if (!profileId || !startDate || !endDate) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez sélectionner une période complète pour le rapport.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setGeneratingReport(true);
      const generatedReport = await generateReport({
        profileId,
        reportType,
        startDate,
        endDate
      });
      
      setActiveReport(generatedReport);
      setActiveTab("preview");
      
      toast({
        title: "Rapport généré avec succès",
        description: "Vous pouvez maintenant le consulter, l'enregistrer ou l'exporter.",
      });
    } catch (error) {
      toast({
        title: "Échec de la génération",
        description: error instanceof Error ? error.message : "Une erreur s'est produite lors de la génération du rapport",
        variant: "destructive"
      });
    } finally {
      setGeneratingReport(false);
    }
  };
  
  const handleSaveReport = async () => {
    if (!activeReport || !profileId) return;
    
    try {
      await saveReport(activeReport);
      toast({
        title: "Rapport enregistré",
        description: "Le rapport a été sauvegardé dans l'historique."
      });
      // Refresh the report history
      getReportHistory(profileId);
    } catch (error) {
      toast({
        title: "Échec de l'enregistrement",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive"
      });
    }
  };
  
  const handleExportPdf = async () => {
    if (!activeReport) return;
    
    try {
      await exportReportPdf(activeReport);
      toast({
        title: "Export réussi",
        description: "Le rapport a été exporté en PDF."
      });
    } catch (error) {
      toast({
        title: "Échec de l'export",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive"
      });
    }
  };
  
  const handleSelectHistoryReport = (report: OfficialReport) => {
    setActiveReport(report);
    setActiveTab("preview");
  };
  
  if (profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-3/4 rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-800">Profil non trouvé</h1>
          <p className="text-gray-600">Le profil demandé n'existe pas ou vous n'avez pas les permissions nécessaires.</p>
          <Button onClick={() => navigate('/profiles')}>Retour aux profils</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Générateur de rapports officiels</h1>
        <Button variant="outline" onClick={() => navigate(`/young-profile/${profileId}`)}>
          Retour au profil
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
          <TabsTrigger value="preview" disabled={!activeReport}>Aperçu</TabsTrigger>
        </TabsList>
        
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres du rapport</CardTitle>
              <CardDescription>Choisissez le type de rapport et la période concernée</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type de rapport</label>
                <Select value={reportType} onValueChange={handleTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type de rapport" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  {reportTypes.find(type => type.id === reportType)?.description || ""}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date de début</label>
                  <DatePicker 
                    date={startDate} 
                    onSelect={handleStartDateChange}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date de fin</label>
                  <DatePicker 
                    date={endDate} 
                    onSelect={handleEndDateChange}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={handleGenerateReport}
                disabled={generatingReport || !startDate || !endDate}
              >
                {generatingReport ? (
                  <>Génération en cours...</>
                ) : (
                  <>
                    <FileDigit className="mr-2 h-4 w-4" />
                    Générer le rapport
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Historique des rapports</CardTitle>
              <CardDescription>Rapports précédemment générés pour ce jeune</CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : reportHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Aucun rapport généré pour ce jeune.
                </p>
              ) : (
                <div className="space-y-2">
                  {reportHistory.map((report) => (
                    <div 
                      key={report.id}
                      className="flex items-center justify-between p-3 border rounded-md cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSelectHistoryReport(report)}
                    >
                      <div>
                        <p className="font-medium">
                          {reportTypes.find(type => type.id === report.reportType)?.label || report.reportType}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(report.startDate), 'dd/MM/yyyy')} - {format(new Date(report.endDate), 'dd/MM/yyyy')}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500">
                        {format(new Date(report.createdAt), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preview" className="space-y-6">
          {activeReport && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>
                      {reportTypes.find(type => type.id === activeReport.reportType)?.label || activeReport.reportType}
                    </CardTitle>
                    <CardDescription>
                      Période: {format(new Date(activeReport.startDate), 'dd/MM/yyyy')} - {format(new Date(activeReport.endDate), 'dd/MM/yyyy')}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={handleSaveReport}>
                      <FileCheck className="h-4 w-4 mr-2" />
                      Sauvegarder
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportPdf}>
                      <Download className="h-4 w-4 mr-2" />
                      Exporter PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimer
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md p-6 space-y-6 bg-white">
                    <div className="text-center border-b pb-4">
                      <h2 className="text-2xl font-bold mb-2">
                        {reportTypes.find(type => type.id === activeReport.reportType)?.label}
                      </h2>
                      <p>
                        Concernant: {profile.first_name} {profile.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Du {format(new Date(activeReport.startDate), 'dd MMMM yyyy', { locale: fr })} au {format(new Date(activeReport.endDate), 'dd MMMM yyyy', { locale: fr })}
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      {activeReport.sections.map((section, index) => (
                        <div key={index}>
                          <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
                          <div className="text-gray-700 whitespace-pre-line">
                            {section.content}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-sm text-gray-500 border-t pt-4">
                      <p>Rapport généré le {format(new Date(activeReport.createdAt), 'dd MMMM yyyy', { locale: fr })}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
