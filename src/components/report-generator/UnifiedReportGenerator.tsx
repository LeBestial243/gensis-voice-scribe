
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TemplateSelector } from "./TemplateSelector";
import { SourceSelector } from "./SourceSelector";
import { ReportEditor } from "./ReportEditor";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUnifiedReportGeneration } from "@/hooks/use-unified-report-generation";
import { Loader2, FileText, Sparkles, Copy, Download, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportResourceType } from "@/types/reports";

interface UnifiedReportGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId?: string;
  reportType?: ReportResourceType;
  initialData?: any;
}

export function UnifiedReportGenerator({
  open,
  onOpenChange,
  profileId,
  reportType = "note",
  initialData,
}: UnifiedReportGeneratorProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("selection");
  
  const {
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
  } = useUnifiedReportGeneration({ 
    profileId, 
    reportType,
    onSuccess: () => onOpenChange(false)
  });

  // Reset state when dialog is closed
  useEffect(() => {
    if (!open) {
      handleReset();
      setActiveTab("selection");
    }
  }, [open, handleReset]);

  // Switch to editing tab when content is generated
  useEffect(() => {
    if (generatedContent && activeTab === "selection") {
      setActiveTab("editing");
    }
  }, [generatedContent, activeTab]);

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen && (generatedContent || selectedFolders.length > 0 || selectedFiles.length > 0)) {
      if (confirm("Êtes-vous sûr de vouloir fermer ? Toutes les modifications seront perdues.")) {
        onOpenChange(false);
      }
      return;
    }
    onOpenChange(isOpen);
  };

  const handleFolderSelect = (folderId: string) => {
    setSelectedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  const handleFileSelect = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSaveReport = async () => {
    if (!generatedContent) {
      toast({
        title: "Contenu manquant",
        description: "Veuillez d'abord générer du contenu",
        variant: "destructive"
      });
      return;
    }

    saveReport.mutate({ 
      title: reportTitle, 
      content: generatedContent,
      metadata: reportMetadata
    });
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(generatedContent);
    toast({
      title: "Copié !",
      description: "Le contenu a été copié dans le presse-papier"
    });
  };

  const handleExportContent = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${reportTitle || "rapport"}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast({
      title: "Exporté !",
      description: `Le fichier "${reportTitle || "rapport"}.txt" a été téléchargé`
    });
  };

  const handleResetGeneration = () => {
    if (confirm("Êtes-vous sûr de vouloir recommencer ? Le contenu généré sera perdu.")) {
      setGeneratedContent("");
      setActiveTab("selection");
    }
  };

  // Traduire le type de rapport pour l'affichage
  const getReportTypeLabel = () => {
    switch (reportType) {
      case "activity":
        return "d'activité";
      case "standardized":
        return "standardisé";
      case "evaluation":
        return "d'évaluation";
      case "note":
      default:
        return "de synthèse";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Génération de rapport {getReportTypeLabel()}
          </DialogTitle>
          <DialogDescription>
            Utilisez l'IA pour générer un rapport structuré à partir de vos documents
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="selection" disabled={isGenerating}>
              Sélection
              {(selectedFolders.length > 0 || selectedFiles.length > 0 || selectedTemplateId) && (
                <div className="flex gap-2 ml-2">
                  {selectedFolders.length > 0 && (
                    <Badge variant="secondary">
                      {selectedFolders.length} dossier(s)
                    </Badge>
                  )}
                  {selectedFiles.length > 0 && (
                    <Badge variant="secondary">
                      {selectedFiles.length} fichier(s)
                    </Badge>
                  )}
                </div>
              )}
            </TabsTrigger>
            <TabsTrigger value="editing" disabled={!generatedContent || isGenerating}>
              Édition
              <Sparkles className="ml-2 h-3 w-3" />
            </TabsTrigger>
          </TabsList>
          
          <div className="overflow-y-auto flex-1 my-4">
            <TabsContent value="selection" className="h-full">
              <div className="grid md:grid-cols-2 gap-6 overflow-hidden">
                <div className="space-y-4">
                  <TemplateSelector
                    selectedTemplateId={selectedTemplateId}
                    onTemplateSelect={setSelectedTemplateId}
                    reportType={reportType}
                  />
                </div>
                <div className="space-y-4">
                  {profileId && (
                    <SourceSelector
                      profileId={profileId}
                      selectedFolders={selectedFolders}
                      onFolderSelect={handleFolderSelect}
                      selectedFiles={selectedFiles}
                      onFileSelect={handleFileSelect}
                      reportMetadata={reportMetadata}
                      onMetadataChange={setReportMetadata}
                      reportType={reportType}
                    />
                  )}
                  {!profileId && (
                    <div className="border border-dashed rounded-lg p-6 text-center">
                      <p className="text-gray-500">
                        Sélection de fichiers disponible uniquement pour les rapports liés à un profil
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="editing" className="h-full">
              {generatedContent && (
                <ReportEditor 
                  reportTitle={reportTitle}
                  onTitleChange={setReportTitle}
                  generatedContent={generatedContent}
                  onContentChange={setGeneratedContent}
                  reportData={reportData}
                  onReportDataChange={setReportData}
                  reportMetadata={reportMetadata}
                  onMetadataChange={setReportMetadata}
                  reportType={reportType}
                />
              )}
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t sticky bottom-0 bg-white z-10">
          {activeTab === "selection" ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleGenerate} 
                disabled={
                  (!selectedTemplateId && selectedFiles.length === 0) || 
                  isGenerating
                }
                className="bg-gradient-to-r from-purple-500 to-indigo-600"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    Générer avec IA
                    {(selectedFiles.length > 0 || selectedTemplateId) && (
                      <Badge variant="outline" className="ml-2 bg-white text-purple-600">
                        {selectedFiles.length > 0 
                          ? `${selectedFiles.length} fichier(s)` 
                          : "Template"}
                      </Badge>
                    )}
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleResetGeneration}>
                Recommencer
              </Button>
              <Button variant="outline" onClick={handleCopyContent} className="gap-2">
                <Copy className="h-4 w-4" />
                Copier
              </Button>
              <Button variant="outline" onClick={handleExportContent} className="gap-2">
                <Download className="h-4 w-4" />
                Exporter
              </Button>
              <Button 
                onClick={handleSaveReport} 
                disabled={saveReport.isPending}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 gap-2"
              >
                {saveReport.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Sauvegarder
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
