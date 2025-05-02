
import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { Loader2, FilePlus, FileText, Send, Printer, Download } from "lucide-react";
import { useOfficialReport } from "@/hooks/useOfficialReport";
import { OfficialReportTemplate } from "@/services/officialReportService";
import { ReportPreview } from "./ReportPreview";

interface OfficialReportGeneratorProps {
  profileId: string;
}

export function OfficialReportGenerator({ profileId }: OfficialReportGeneratorProps) {
  const [activeTab, setActiveTab] = useState("generate");
  
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
    isGenerating,
    isSaving,
    isExporting,
    
    // Actions
    handleGenerateReport,
    handleSaveReport,
    handleExportPdf
  } = useOfficialReport({ profileId });
  
  // Find the selected template details for display
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  
  return (
    <div className="grid gap-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate" className="text-base">
            Générer un rapport
          </TabsTrigger>
          <TabsTrigger value="history" className="text-base">
            Historique des rapports
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="generate" className="space-y-6 pt-4">
          <div className="grid md:grid-cols-5 gap-6">
            {/* Left column: Report settings */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Paramètres du rapport
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingTemplates ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="template">Modèle de rapport</Label>
                        <Select 
                          value={selectedTemplateId} 
                          onValueChange={setSelectedTemplateId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un modèle" />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {selectedTemplate && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {selectedTemplate.description}
                          </p>
                        )}
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <Label>Période du rapport</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="start-date" className="text-sm">Date de début</Label>
                            <DatePicker
                              date={periodStart}
                              setDate={setPeriodStart}
                              className="w-full"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="end-date" className="text-sm">Date de fin</Label>
                            <DatePicker
                              date={periodEnd}
                              setDate={setPeriodEnd}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <Label>Sources de données</Label>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="include-notes" className="cursor-pointer">
                              Inclure les notes
                            </Label>
                            <Switch
                              id="include-notes"
                              checked={includeNotes}
                              onCheckedChange={setIncludeNotes}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Label htmlFor="include-transcriptions" className="cursor-pointer">
                              Inclure les transcriptions
                            </Label>
                            <Switch
                              id="include-transcriptions"
                              checked={includeTranscriptions}
                              onCheckedChange={setIncludeTranscriptions}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <Label htmlFor="instructions">Instructions spécifiques</Label>
                        <Textarea
                          id="instructions"
                          placeholder="Instructions spécifiques pour la génération du rapport..."
                          value={customInstructions}
                          onChange={(e) => setCustomInstructions(e.target.value)}
                          rows={4}
                        />
                        <p className="text-xs text-muted-foreground">
                          Instructions optionnelles pour personnaliser le contenu généré
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full"
                    disabled={isGenerating || !selectedTemplateId || !periodStart || !periodEnd}
                    onClick={handleGenerateReport}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Génération en cours...
                      </>
                    ) : (
                      <>
                        <FilePlus className="mr-2 h-4 w-4" />
                        Générer le rapport
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
              
              {selectedTemplate && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Structure du rapport</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedTemplate.sections.map((section, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="bg-primary/10 text-primary p-1 rounded-full min-w-5 h-5 flex items-center justify-center text-xs">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium">{section.title}</p>
                            {section.description && (
                              <p className="text-xs text-muted-foreground">{section.description}</p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Right column: Report preview */}
            <div className="md:col-span-3">
              <Card className="h-full flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Aperçu du rapport
                  </CardTitle>
                  
                  {generatedReport && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleSaveReport} 
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        <span className="ml-1 hidden sm:inline">Sauvegarder</span>
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => window.print()}
                      >
                        <Printer className="h-4 w-4" />
                        <span className="ml-1 hidden sm:inline">Imprimer</span>
                      </Button>
                      
                      <Button size="sm" variant="outline" onClick={() => handleExportPdf("temp-id")}>
                        <Download className="h-4 w-4" />
                        <span className="ml-1 hidden sm:inline">Exporter PDF</span>
                      </Button>
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="flex-1 overflow-auto">
                  {isGenerating ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      <p className="text-muted-foreground">Génération du rapport en cours...</p>
                    </div>
                  ) : generatedReport ? (
                    <ReportPreview report={generatedReport} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-4 py-12 text-center border-2 border-dashed rounded-lg">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Aucun rapport généré</p>
                        <p className="text-muted-foreground max-w-md mx-auto">
                          Sélectionnez un modèle de rapport et une période, puis cliquez sur "Générer le rapport" pour voir un aperçu ici.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des rapports</CardTitle>
            </CardHeader>
            <CardContent>
              {existingReports.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Aucun rapport n'a encore été sauvegardé</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {existingReports.map((report) => (
                    <div 
                      key={report.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{report.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            {report.institution}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(report.createdAt), "dd/MM/yyyy")}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <FileText className="h-4 w-4" />
                          <span className="ml-1 hidden sm:inline">Voir</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleExportPdf(report.id)}
                        >
                          <Download className="h-4 w-4" />
                          <span className="ml-1 hidden sm:inline">PDF</span>
                        </Button>
                      </div>
                    </div>
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
