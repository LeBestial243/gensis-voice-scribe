
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplateSelector } from "./TemplateSelector";
import { FileSelector } from "./FileSelector";
import { ResultEditor } from "./ResultEditor";
import { useNoteGeneration } from "@/hooks/use-note-generation";

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
  const [activeStep, setActiveStep] = useState("template");
  const {
    selectedTemplateId,
    setSelectedTemplateId,
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
    onSuccess: () => {
      handleReset();
      onOpenChange(false);
    },
  });

  const handleFileSelect = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId) 
        : [...prev, fileId]
    );
  };

  const handleGenerateClick = async () => {
    const nextStep = await handleGenerate();
    if (nextStep) {
      setActiveStep(nextStep);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent)
      .then(() => {
        toast({
          title: "Copié !",
          description: "Le contenu a été copié dans le presse-papier"
        });
      })
      .catch(() => {
        toast({
          title: "Erreur",
          description: "Impossible de copier le contenu",
          variant: "destructive"
        });
      });
  };

  const handleExport = () => {
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${noteTitle.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exporté !",
      description: "La note a été exportée en fichier texte"
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Générer une note IA</DialogTitle>
          <DialogDescription>
            Utilisez l'IA pour générer une synthèse à partir des informations du dossier.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeStep} onValueChange={setActiveStep} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="template">1. Template</TabsTrigger>
            <TabsTrigger value="files">2. Fichiers</TabsTrigger>
            <TabsTrigger value="result" disabled={!generatedContent}>3. Résultat</TabsTrigger>
          </TabsList>

          <TabsContent value="template">
            <TemplateSelector
              selectedTemplateId={selectedTemplateId}
              onTemplateSelect={setSelectedTemplateId}
            />
            <div className="flex justify-end mt-4">
              <Button
                onClick={() => setActiveStep("files")}
                disabled={!selectedTemplateId}
              >
                Suivant
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="files">
            <FileSelector
              profileId={profileId}
              selectedFiles={selectedFiles}
              onFileSelect={handleFileSelect}
            />
            <div className="flex justify-between mt-4">
              <Button
                variant="outline"
                onClick={() => setActiveStep("template")}
              >
                Retour
              </Button>
              <Button
                onClick={handleGenerateClick}
                disabled={isGenerating || selectedFiles.length === 0}
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Génération en cours...
                  </>
                ) : (
                  "Générer la note"
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="result">
            <ResultEditor
              noteTitle={noteTitle}
              onTitleChange={setNoteTitle}
              generatedContent={generatedContent}
              onContentChange={setGeneratedContent}
              onSave={() => saveNote.mutate({ title: noteTitle, content: generatedContent })}
              onCopy={handleCopy}
              onExport={handleExport}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
