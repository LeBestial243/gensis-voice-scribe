
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TemplateSelector } from "./TemplateSelector";
import { FolderSelector } from "./FolderSelector";
import { ResultEditor } from "./ResultEditor";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNoteGeneration } from "@/hooks/use-note-generation";
import { Loader2, FileText, Pencil, Save, Copy, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GenerateNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
}

export function GenerateNoteDialog({
  open,
  onOpenChange,
  profileId,
}: GenerateNoteDialogProps) {
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
    noteTitle,
    setNoteTitle,
    isGenerating,
    handleGenerate,
    handleReset,
    saveNote,
  } = useNoteGeneration({ 
    profileId, 
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

  const handleSaveNote = async () => {
    if (!generatedContent) {
      toast({
        title: "Contenu manquant",
        description: "Veuillez d'abord générer du contenu",
        variant: "destructive"
      });
      return;
    }

    saveNote.mutate({ 
      title: noteTitle, 
      content: generatedContent 
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
    element.download = `${noteTitle}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast({
      title: "Exporté !",
      description: `Le fichier "${noteTitle}.txt" a été téléchargé`
    });
  };

  const handleResetGeneration = () => {
    if (confirm("Êtes-vous sûr de vouloir recommencer ? Le contenu généré sera perdu.")) {
      setGeneratedContent("");
      setActiveTab("selection");
    }
  };

  console.log("Dialog state:", { 
    activeTab, 
    selectedTemplateId, 
    selectedFoldersCount: selectedFolders.length,
    selectedFilesCount: selectedFiles.length,
    hasGeneratedContent: !!generatedContent,
    isGenerating
  });

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Génération de note IA
          </DialogTitle>
          <DialogDescription>
            Utilisez l'IA pour générer une note structurée à partir de vos dossiers
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
                  <FolderSelector
                    profileId={profileId}
                    selectedFolders={selectedFolders}
                    onFolderSelect={handleFolderSelect}
                    selectedFiles={selectedFiles}
                    onFileSelect={handleFileSelect}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="editing" className="h-full">
              {generatedContent && (
                <ResultEditor
                  noteTitle={noteTitle}
                  onTitleChange={setNoteTitle}
                  generatedContent={generatedContent}
                  onContentChange={setGeneratedContent}
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
                    Générer une note
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
              <Button variant="outline" onClick={handleCopyContent} className="gap-2">
                <Copy className="h-4 w-4" />
                Copier
              </Button>
              <Button variant="outline" onClick={handleExportContent} className="gap-2">
                <Download className="h-4 w-4" />
                Exporter
              </Button>
              <Button 
                onClick={handleSaveNote} 
                disabled={saveNote.isPending}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 gap-2"
              >
                {saveNote.isPending ? (
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
