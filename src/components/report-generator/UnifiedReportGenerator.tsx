
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ReportEditor } from "./ReportEditor";
import { useToast } from "@/hooks/use-toast";
import { useReportGeneration } from "@/hooks/use-unified-report-generation";
import { FileText } from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";

// Import refactored components
import { TabHeader } from "./components/TabHeader";
import { SelectionPanel } from "./components/SelectionPanel";
import { SelectionActions, EditingActions } from "./components/TabActions";
import { getReportTypeLabel, createDownloadableFile } from "./utils/report-utils";

// Types
import { StandardizedReportType } from "@/types/reports";

interface UnifiedReportGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId?: string;
  reportType?: StandardizedReportType;
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
  } = useReportGeneration({ 
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
    createDownloadableFile(generatedContent, reportTitle || "rapport");
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

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Génération de rapport {getReportTypeLabel(reportType)}
          </DialogTitle>
          <DialogDescription>
            Utilisez l'IA pour générer un rapport structuré à partir de vos documents
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabHeader 
            activeTab={activeTab}
            selectedFolders={selectedFolders}
            selectedFiles={selectedFiles}
            selectedTemplateId={selectedTemplateId}
            isGenerating={isGenerating}
            generatedContent={generatedContent}
          />
          
          <div className="overflow-y-auto flex-1 my-4">
            <TabsContent value="selection" className="h-full">
              <SelectionPanel 
                selectedTemplateId={selectedTemplateId}
                setSelectedTemplateId={setSelectedTemplateId}
                profileId={profileId}
                selectedFolders={selectedFolders}
                onFolderSelect={handleFolderSelect}
                selectedFiles={selectedFiles}
                onFileSelect={handleFileSelect}
                reportMetadata={reportMetadata}
                onMetadataChange={setReportMetadata}
                reportType={reportType}
              />
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
            <SelectionActions 
              onClose={() => onOpenChange(false)}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              isDisabled={!selectedTemplateId && selectedFiles.length === 0}
              selectedFilesCount={selectedFiles.length}
              hasSelectedTemplate={!!selectedTemplateId}
            />
          ) : (
            <EditingActions 
              onReset={handleResetGeneration}
              onCopy={handleCopyContent}
              onExport={handleExportContent}
              onSave={handleSaveReport}
              isSaving={saveReport.isPending}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
