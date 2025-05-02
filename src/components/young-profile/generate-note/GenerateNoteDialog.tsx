
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
import { useNoteGenerationReducer } from "@/hooks/useNoteGenerationReducer";

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
  
  // Use the reducer instead of multiple useState calls
  const { state, dispatch } = useNoteGenerationReducer();
  
  const {
    handleGenerate: generateNote,
    handleReset: resetNote,
    saveNote,
  } = useNoteGeneration({ 
    profileId, 
    onSuccess: () => onOpenChange(false),
    // Pass state from reducer
    selectedTemplateId: state.selectedTemplateId,
    selectedFolders: state.selectedFolders,
    selectedFiles: state.selectedFiles,
    generatedContent: state.generatedContent,
    noteTitle: state.noteTitle,
    isGenerating: state.isGenerating,
    // Pass dispatch functions
    setSelectedTemplateId: (id) => dispatch({ type: "SET_TEMPLATE", id }),
    setSelectedFolders: (folders) => folders.forEach(folderId => dispatch({ type: "SET_FOLDER", folderId })),
    setSelectedFiles: (files) => files.forEach(fileId => dispatch({ type: "SET_FILE", fileId })),
    setGeneratedContent: (content) => dispatch({ type: "SET_CONTENT", content }),
    setNoteTitle: (title) => dispatch({ type: "SET_TITLE", title }),
    setIsGenerating: (isGenerating) => dispatch({ type: "SET_GENERATING", isGenerating }),
  });

  // Reset state when dialog is closed
  useEffect(() => {
    if (!open) {
      dispatch({ type: "RESET" });
      setActiveTab("selection");
    }
  }, [open]);

  // Switch to editing tab when content is generated
  useEffect(() => {
    if (state.generatedContent && activeTab === "selection") {
      setActiveTab("editing");
    }
  }, [state.generatedContent, activeTab]);

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen && (state.generatedContent || state.selectedFolders.length > 0 || state.selectedFiles.length > 0)) {
      if (confirm("Êtes-vous sûr de vouloir fermer ? Toutes les modifications seront perdues.")) {
        onOpenChange(false);
      }
      return;
    }
    onOpenChange(isOpen);
  };

  const handleFolderSelect = (folderId: string) => {
    dispatch({ type: "SET_FOLDER", folderId });
  };

  const handleFileSelect = (fileId: string) => {
    dispatch({ type: "SET_FILE", fileId });
  };

  const handleSaveNote = async () => {
    if (!state.generatedContent) {
      toast({
        title: "Contenu manquant",
        description: "Veuillez d'abord générer du contenu",
        variant: "destructive"
      });
      return;
    }

    saveNote.mutate({ 
      title: state.noteTitle, 
      content: state.generatedContent 
    });
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(state.generatedContent);
    toast({
      title: "Copié !",
      description: "Le contenu a été copié dans le presse-papier"
    });
  };

  const handleExportContent = () => {
    const element = document.createElement("a");
    const file = new Blob([state.generatedContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${state.noteTitle}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast({
      title: "Exporté !",
      description: `Le fichier "${state.noteTitle}.txt" a été téléchargé`
    });
  };

  const handleResetGeneration = () => {
    if (confirm("Êtes-vous sûr de vouloir recommencer ? Le contenu généré sera perdu.")) {
      dispatch({ type: "SET_CONTENT", content: "" });
      setActiveTab("selection");
    }
  };

  const handleGenerate = () => {
    generateNote();
  };

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
            <TabsTrigger value="selection" disabled={state.isGenerating}>
              Sélection
              {(state.selectedFolders.length > 0 || state.selectedFiles.length > 0) && (
                <div className="flex gap-2 ml-2">
                  {state.selectedFolders.length > 0 && (
                    <Badge variant="secondary">
                      {state.selectedFolders.length} dossier(s)
                    </Badge>
                  )}
                  {state.selectedFiles.length > 0 && (
                    <Badge variant="secondary">
                      {state.selectedFiles.length} fichier(s)
                    </Badge>
                  )}
                </div>
              )}
            </TabsTrigger>
            <TabsTrigger value="editing" disabled={!state.generatedContent || state.isGenerating}>
              Édition
              <Pencil className="ml-2 h-3 w-3" />
            </TabsTrigger>
          </TabsList>
          
          <div className="overflow-y-auto flex-1 my-4">
            <TabsContent value="selection" className="h-full">
              <div className="grid md:grid-cols-2 gap-6 overflow-hidden">
                <div className="space-y-4">
                  <TemplateSelector
                    selectedTemplateId={state.selectedTemplateId}
                    onTemplateSelect={(id) => dispatch({ type: "SET_TEMPLATE", id })}
                  />
                </div>
                <div className="space-y-4">
                  <FolderSelector
                    profileId={profileId}
                    selectedFolders={state.selectedFolders}
                    onFolderSelect={handleFolderSelect}
                    selectedFiles={state.selectedFiles}
                    onFileSelect={handleFileSelect}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="editing" className="h-full">
              {state.generatedContent && (
                <ResultEditor
                  noteTitle={state.noteTitle}
                  onTitleChange={(title) => dispatch({ type: "SET_TITLE", title })}
                  generatedContent={state.generatedContent}
                  onContentChange={(content) => dispatch({ type: "SET_CONTENT", content })}
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
                disabled={!state.selectedTemplateId || (state.selectedFolders.length === 0 && state.selectedFiles.length === 0) || state.isGenerating}
                className="bg-gradient-to-r from-purple-500 to-indigo-600"
              >
                {state.isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    Générer une note
                    {state.selectedFiles.length > 0 && (
                      <Badge variant="outline" className="ml-2 bg-white text-purple-600">
                        {state.selectedFiles.length} fichier(s)
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
