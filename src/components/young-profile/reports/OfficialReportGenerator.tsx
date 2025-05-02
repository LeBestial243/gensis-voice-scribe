
import { useState } from "react";
import { useOfficialReport } from "@/hooks/useOfficialReport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReportPreview } from "./ReportPreview";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface OfficialReportGeneratorProps {
  profileId: string;
}

export function OfficialReportGenerator({ profileId }: OfficialReportGeneratorProps) {
  const {
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
    
    // Loading states
    isLoadingTemplates,
    isLoadingReports,
    isGenerating,
    isSaving,
    isExporting,
    
    // Actions
    handleGenerateReport,
    handleSaveReport,
    handleExportPdf
  } = useOfficialReport({ profileId });
  
  const [activeTab, setActiveTab] = useState<string>("generate");
  
  return (
    <Tabs 
      defaultValue="generate"
      value={activeTab} 
      onValueChange={setActiveTab}
      className="space-y-4"
    >
      <div className="flex justify-between items-center">
        <TabsList>
          <TabsTrigger value="generate">Générer</TabsTrigger>
          <TabsTrigger value="history">Historique des rapports</TabsTrigger>
        </TabsList>
        
        {activeTab === "generate" && generatedReport && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setActiveTab("preview")}
            >
              Prévisualiser
            </Button>
            
            <Button
              onClick={handleSaveReport}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Sauvegarde...
                </>
              ) : (
                "Sauvegarder"
              )}
            </Button>
          </div>
        )}
      </div>
      
      <TabsContent value="generate" className="mt-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Paramètres du rapport</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="template">Type de rapport</Label>
              <Select
                value={selectedTemplateId}
                onValueChange={setSelectedTemplateId}
                disabled={isLoadingTemplates}
              >
                <SelectTrigger id="template" className="w-full">
                  <SelectValue placeholder="Sélectionnez un modèle de rapport" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingTemplates ? (
                    <div className="flex justify-center p-2">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : (
                    templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="period-start">Début de la période</Label>
                <DatePicker
                  id="period-start"
                  date={periodStart}
                  setDate={setPeriodStart}
                />
              </div>
              
              <div>
                <Label htmlFor="period-end">Fin de la période</Label>
                <DatePicker
                  id="period-end"
                  date={periodEnd}
                  setDate={setPeriodEnd}
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Sources de données</h3>
              
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
                <Label htmlFor="include-transcriptions">Inclure les transcriptions</Label>
              </div>
            </div>
            
            <div>
              <Label htmlFor="custom-instructions">Instructions spécifiques (facultatif)</Label>
              <Textarea
                id="custom-instructions"
                placeholder="Entrez des instructions spécifiques pour la génération du rapport..."
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            <Button 
              onClick={handleGenerateReport}
              className="w-full"
              disabled={isGenerating || !selectedTemplateId || !periodStart || !periodEnd}
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
          </CardContent>
        </Card>
        
        {generatedReport && (
          <Card>
            <CardHeader>
              <CardTitle>Aperçu du rapport généré</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportPreview report={generatedReport} />
            </CardContent>
          </Card>
        )}
      </TabsContent>
      
      <TabsContent value="history" className="mt-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Historique des rapports</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingReports ? (
              <div className="flex justify-center p-6">
                <LoadingSpinner size="lg" />
              </div>
            ) : existingReports.length > 0 ? (
              <div className="space-y-4">
                {existingReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{report.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Créé le {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // View report logic
                        }}
                      >
                        Voir
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportPdf(report.id)}
                        disabled={isExporting}
                      >
                        {isExporting ? <LoadingSpinner size="sm" /> : "Exporter PDF"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-6 text-muted-foreground">
                Aucun rapport sauvegardé pour ce profil.
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="preview" className="mt-4 space-y-4">
        <div className="flex justify-between mb-4">
          <Button
            variant="outline"
            onClick={() => setActiveTab("generate")}
          >
            Retour aux paramètres
          </Button>
          <Button
            onClick={() => {
              window.print();
            }}
          >
            Imprimer
          </Button>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-8 print:p-0 print:shadow-none">
          {generatedReport ? (
            <ReportPreview report={generatedReport} />
          ) : (
            <p className="text-center py-6">Aucun rapport à prévisualiser.</p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
