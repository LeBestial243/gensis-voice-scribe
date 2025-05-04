
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, Pencil, Save, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplateSelector } from "@/components/young-profile/generate-note/TemplateSelector";
import { FolderSelector } from "@/components/young-profile/generate-note/FolderSelector";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ActivityReport, ReportSection, Template } from "@/types/reports";
import { StandardizedReport } from "@/types/casf";

interface GenerateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId?: string; // Optionnel pour les rapports d'activité
  reportType: "activity" | "standardized";
  onSubmit: (data: any) => Promise<any>;
  initialData?: Partial<ActivityReport | StandardizedReport>;
  isLoading: boolean;
}

export function GenerateReportDialog({
  open,
  onOpenChange,
  profileId,
  reportType,
  onSubmit,
  initialData,
  isLoading,
}: GenerateReportDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("selection");
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  // État pour le rapport généré
  const [reportData, setReportData] = useState<Partial<ActivityReport | StandardizedReport>>(
    initialData || {}
  );

  // Reset state when dialog is closed
  useEffect(() => {
    if (!open) {
      handleReset();
      setActiveTab("selection");
    }
  }, [open]);

  // Switch to editing tab when content is generated
  useEffect(() => {
    if (generatedContent && activeTab === "selection") {
      setActiveTab("editing");
    }
  }, [generatedContent, activeTab]);

  const handleReset = () => {
    setSelectedTemplateId("");
    setSelectedFolders([]);
    setSelectedFiles([]);
    setGeneratedContent("");
    setReportData(initialData || {});
  };

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

  const handleGenerate = async () => {
    if (!selectedTemplateId || (selectedFolders.length === 0 && selectedFiles.length === 0)) {
      toast({
        title: "Sélection incomplète",
        description: "Veuillez sélectionner un template et au moins un dossier ou fichier",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Ici, vous pourriez appeler une API pour générer le contenu avec l'IA
      // Pour cet exemple, nous simulons un délai et un contenu généré
      
      // Simuler une requête API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Générer un contenu d'exemple
      const sections: ReportSection[] = [
        { 
          title: "Résumé", 
          content: `Résumé généré par IA basé sur ${selectedFiles.length} document(s) sélectionné(s).`,
          type: "text"
        },
        {
          title: "Analyse",
          content: "Analyse détaillée générée par IA basée sur les documents sélectionnés.",
          type: "text"
        },
        {
          title: "Recommandations",
          content: "Recommandations basées sur l'analyse des documents.",
          type: "text"
        }
      ];
      
      // Mettre à jour les données du rapport
      const newReportData = {
        ...reportData,
        title: "Nouveau rapport généré par IA",
        content: {
          sections,
          ...(reportType === "activity" ? { metrics: [] } : { template_id: selectedTemplateId })
        }
      };
      
      setReportData(newReportData);
      
      // Convertir les sections en texte pour l'éditeur
      const contentText = sections.map(section => 
        `# ${section.title}\n\n${section.content}\n\n`
      ).join('');
      
      setGeneratedContent(contentText);
      setActiveTab("editing");
      
      toast({
        title: "Génération réussie",
        description: "Le contenu a été généré avec succès"
      });
    } catch (error) {
      console.error("Erreur lors de la génération:", error);
      toast({
        title: "Erreur de génération",
        description: "Une erreur est survenue lors de la génération du contenu",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContentChange = (content: string) => {
    setGeneratedContent(content);
    
    // Essayer de parser le contenu en sections
    try {
      const sectionRegex = /^# (.+)$([\s\S]*?)(?=^# |$)/gm;
      const sections = [];
      let match;
      
      while ((match = sectionRegex.exec(content + '\n# '))) {
        const title = match[1].trim();
        const sectionContent = match[2].trim();
        
        sections.push({
          title,
          content: sectionContent,
          type: "text"
        });
      }
      
      if (sections.length > 0) {
        setReportData(prev => ({
          ...prev,
          content: {
            ...((prev.content as any) || {}),
            sections
          }
        }));
      }
    } catch (e) {
      console.error("Erreur lors du parsing du contenu:", e);
    }
  };

  const handleSubmitForm = async () => {
    try {
      await onSubmit(reportData);
      onOpenChange(false);
      toast({
        title: "Rapport enregistré",
        description: "Votre rapport a été enregistré avec succès"
      });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement du rapport",
        variant: "destructive"
      });
    }
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
            Génération de rapport IA
          </DialogTitle>
          <DialogDescription>
            Utilisez l'IA pour générer un rapport structuré à partir de vos documents
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="selection" disabled={isGenerating}>
              Sélection
              {(selectedFolders.length > 0 || selectedFiles.length > 0) && (
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
              <Pencil className="ml-2 h-3 w-3" />
            </TabsTrigger>
          </TabsList>
          
          <div className="overflow-y-auto flex-1 my-4">
            <TabsContent value="selection" className="h-full">
              <div className="grid md:grid-cols-2 gap-6 overflow-hidden">
                <div className="space-y-4">
                  <TemplateSelector
                    selectedTemplateId={selectedTemplateId}
                    onTemplateSelect={setSelectedTemplateId}
                  />
                </div>
                <div className="space-y-4">
                  {profileId && (
                    <FolderSelector
                      profileId={profileId}
                      selectedFolders={selectedFolders}
                      onFolderSelect={handleFolderSelect}
                      selectedFiles={selectedFiles}
                      onFileSelect={handleFileSelect}
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
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="report-title" className="text-base font-medium">Titre du rapport</Label>
                    <Input
                      id="report-title"
                      value={(reportData.title as string) || ""}
                      onChange={(e) => setReportData(prev => ({ ...prev, title: e.target.value }))}
                      className="flex h-10 w-full"
                      placeholder="Entrez un titre pour le rapport"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="generated-content" className="text-base font-medium">Contenu du rapport</Label>
                    <div className="relative">
                      <Textarea
                        id="generated-content"
                        value={generatedContent}
                        onChange={(e) => handleContentChange(e.target.value)}
                        className="min-h-[400px] text-base p-4 rounded-lg"
                        placeholder="Le contenu généré apparaîtra ici. Vous pourrez le modifier avant de sauvegarder."
                      />
                    </div>
                  </div>
                </div>
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
                disabled={!selectedTemplateId || (selectedFolders.length === 0 && selectedFiles.length === 0) || isGenerating}
                className="bg-gradient-to-r from-purple-500 to-indigo-600"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    Générer un rapport
                    {selectedFiles.length > 0 && (
                      <Badge variant="outline" className="ml-2 bg-white text-purple-600">
                        {selectedFiles.length} fichier(s)
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
              <Button variant="outline" onClick={() => {
                navigator.clipboard.writeText(generatedContent);
                toast({
                  title: "Copié !",
                  description: "Le contenu a été copié dans le presse-papier"
                });
              }} className="gap-2">
                <Copy className="h-4 w-4" />
                Copier
              </Button>
              <Button 
                onClick={handleSubmitForm} 
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 gap-2"
              >
                {isLoading ? (
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
