
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useOfficialReport } from '@/hooks/useOfficialReport';
import { OfficialReport, ReportSection } from '@/types/reports';
import { ReportPreview } from './ReportPreview';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function OfficialReportGenerator() {
  const { profileId } = useParams<{ profileId: string }>();
  const { toast } = useToast();
  
  // Use the custom hook
  const {
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
    isGenerating,
    isSaving,
    isExporting,
    
    // Actions
    handleGenerateReport,
    handleSaveReport,
    handleExportPdf,
    refetchReports
  } = useOfficialReport({ profileId: profileId || '' });

  const [activeTab, setActiveTab] = useState("generate");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [availableTranscriptions, setAvailableTranscriptions] = useState<number>(0);
  
  // Helper function to format dates
  const formatDate = (date?: Date) => {
    if (!date) return '';
    return format(date, 'PPP', { locale: fr });
  };
  
  // Get the selected report
  const selectedReport = existingReports.find(report => report.id === selectedReportId);
  
  // Fetch transcription count to inform the user
  useEffect(() => {
    if (!profileId) return;

    const fetchTranscriptionsCount = async () => {
      try {
        // First get folder IDs associated with this profile
        const { data: folders, error: foldersError } = await supabase
          .from('folders')
          .select('id')
          .eq('profile_id', profileId);

        if (foldersError) throw foldersError;
        
        if (folders && folders.length > 0) {
          const folderIds = folders.map(folder => folder.id);
          
          // Now get transcriptions count from these folders
          const { count, error: countError } = await supabase
            .from('files')
            .select('*', { count: 'exact', head: true })
            .eq('type', 'transcription')
            .in('folder_id', folderIds);
          
          if (countError) throw countError;
          
          setAvailableTranscriptions(count || 0);
        } else {
          setAvailableTranscriptions(0);
        }
      } catch (error) {
        console.error("Error fetching transcriptions count:", error);
      }
    };
    
    fetchTranscriptionsCount();
  }, [profileId]);
  
  // Generate report handler
  const onGenerateReport = async () => {
    try {
      if (!profileId || !selectedTemplateId || !periodStart || !periodEnd) {
        toast({
          title: "Paramètres manquants",
          description: "Veuillez remplir tous les champs obligatoires",
          variant: "destructive"
        });
        return;
      }
      
      if (includeTranscriptions && availableTranscriptions === 0) {
        toast({
          title: "Aucune transcription disponible",
          description: "Il n'y a pas de transcriptions à inclure dans le rapport",
          variant: "default"
        });
      }
      
      await handleGenerateReport({
        profileId,
        templateId: selectedTemplateId,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        includeNotes,
        includeTranscriptions,
        customInstructions
      });

      // Switch to Preview tab after generation
      setActiveTab("preview");
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la génération du rapport",
        variant: "destructive"
      });
    }
  };

  // Save report handler
  const onSaveReport = async () => {
    try {
      if (!generatedReport || !profileId) return;
      
      await handleSaveReport(generatedReport);
      setActiveTab("history");
    } catch (error) {
      console.error("Error saving report:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde du rapport",
        variant: "destructive"
      });
    }
  };
  
  // Export report handler
  const onExportReport = async (reportId: string) => {
    try {
      await handleExportPdf(reportId);
    } catch (error) {
      console.error("Error exporting report:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'export du rapport",
        variant: "destructive"
      });
    }
  };

  // Helper to get profile name
  const [profileName, setProfileName] = useState<string>("Profil");
  
  // Fetch profile name
  useEffect(() => {
    if (!profileId) return;
    
    const fetchProfileName = async () => {
      try {
        const { data, error } = await supabase
          .from('young_profiles')
          .select('first_name, last_name')
          .eq('id', profileId)
          .single();
        
        if (error) throw error;
        if (data) {
          setProfileName(`${data.first_name} ${data.last_name}`);
        }
      } catch (error) {
        console.error("Error fetching profile name:", error);
      }
    };
    
    fetchProfileName();
  }, [profileId]);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="generate">Génération</TabsTrigger>
          <TabsTrigger value="preview">Aperçu</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Générer un nouveau rapport</CardTitle>
              <CardDescription>
                Sélectionnez un modèle et configurez les paramètres du rapport
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingTemplates ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="md" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="report-template">Modèle de rapport</Label>
                    <Select
                      value={selectedTemplateId}
                      onValueChange={setSelectedTemplateId}
                    >
                      <SelectTrigger id="report-template">
                        <SelectValue placeholder="Sélectionnez un modèle" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Période de début</Label>
                      <DatePicker 
                        date={periodStart} 
                        setDate={setPeriodStart}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Période de fin</Label>
                      <DatePicker 
                        date={periodEnd}
                        setDate={setPeriodEnd}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="include-notes"
                        checked={includeNotes}
                        onCheckedChange={setIncludeNotes}
                      />
                      <Label htmlFor="include-notes">Inclure les notes</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="include-transcriptions"
                        checked={includeTranscriptions}
                        onCheckedChange={setIncludeTranscriptions}
                      />
                      <Label htmlFor="include-transcriptions">
                        Inclure les transcriptions
                        {availableTranscriptions > 0 && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({availableTranscriptions} disponible{availableTranscriptions > 1 ? 's' : ''})
                          </span>
                        )}
                        {availableTranscriptions === 0 && (
                          <span className="text-xs text-orange-500 ml-2">
                            (Aucune transcription disponible)
                          </span>
                        )}
                      </Label>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="custom-instructions">Instructions spécifiques (optionnel)</Label>
                    <Textarea
                      id="custom-instructions"
                      placeholder="Entrez des instructions spécifiques pour la génération du rapport..."
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <Button 
                    onClick={onGenerateReport} 
                    disabled={!selectedTemplateId || !periodStart || !periodEnd || isGenerating}
                    className="w-full md:w-auto"
                  >
                    {isGenerating ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Génération en cours...
                      </>
                    ) : (
                      "Générer le rapport"
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Aperçu du rapport</CardTitle>
                <CardDescription>
                  Vérifiez et ajustez le contenu avant de sauvegarder
                </CardDescription>
              </div>
              
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab("generate")}
                >
                  Retour
                </Button>
                <Button 
                  onClick={onSaveReport}
                  disabled={!generatedReport || isSaving}
                >
                  {isSaving ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Sauvegarde...
                    </>
                  ) : (
                    "Sauvegarder le rapport"
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {generatedReport ? (
                <ReportPreview report={generatedReport} />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Aucun rapport généré. Veuillez d'abord générer un rapport.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rapports sauvegardés</CardTitle>
              <CardDescription>
                Historique des rapports pour {profileName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingReports ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="md" />
                </div>
              ) : existingReports.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Aucun rapport sauvegardé pour ce profil.
                </div>
              ) : (
                <div className="space-y-4">
                  {existingReports.map((report) => (
                    <Card key={report.id} className={`cursor-pointer transition-colors ${selectedReportId === report.id ? 'bg-accent/10' : ''}`}
                      onClick={() => setSelectedReportId(report.id === selectedReportId ? null : report.id)}>
                      <CardHeader className="py-4">
                        <CardTitle className="text-lg">{report.title}</CardTitle>
                        <CardDescription>
                          {(report.report_type || report.reportType || '')} • Du {format(parseISO(report.periodStart || report.period_start || ''), "dd MMMM yyyy", { locale: fr })} au {format(parseISO(report.periodEnd || report.period_end || ''), "dd MMMM yyyy", { locale: fr })}
                        </CardDescription>
                      </CardHeader>
                      {selectedReportId === report.id && (
                        <CardContent>
                          <div className="space-y-4">
                            {(report.sections && Array.isArray(report.sections)) ? (
                              report.sections.map((section: ReportSection, idx: number) => (
                                <div key={idx} className="space-y-2">
                                  <h4 className="font-semibold text-sm">{section.title}</h4>
                                  {typeof section.content === 'string' ? (
                                    <p className="text-sm text-muted-foreground">{section.content}</p>
                                  ) : Array.isArray(section.content) ? (
                                    <ul className="list-disc pl-5">
                                      {section.content.map((item: string, i: number) => (
                                        <li key={i} className="text-sm text-muted-foreground">{item}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">Contenu structuré</p>
                                  )}
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">Aucune section disponible</p>
                            )}
                            <div className="flex justify-end space-x-2 pt-2">
                              <Button 
                                variant="outline"
                                size="sm"
                                onClick={() => onExportReport(report.id)}
                                disabled={isExporting}
                              >
                                {isExporting ? (
                                  <LoadingSpinner size="sm" className="mr-2" />
                                ) : (
                                  "Exporter en PDF"
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
