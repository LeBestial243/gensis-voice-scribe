
import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TemplateSelector } from "./TemplateSelector";
import { FileSelector } from "./FileSelector";
import { ResultEditor } from "./ResultEditor";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNoteGeneration } from "@/hooks/use-note-generation";
import { Loader2 } from "lucide-react";

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
    onSuccess: () => onOpenChange(false)
  });

  // Reset state when dialog is closed
  useEffect(() => {
    if (!open) {
      handleReset();
    }
  }, [open, handleReset]);

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen && (generatedContent || selectedFiles.length > 0)) {
      if (confirm("Êtes-vous sûr de vouloir fermer ? Toutes les modifications seront perdues.")) {
        onOpenChange(false);
      }
      return;
    }
    onOpenChange(isOpen);
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

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Génération de note IA</DialogTitle>
          <DialogDescription>
            Utilisez l'IA pour générer une note structurée à partir de vos transcriptions
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 overflow-hidden flex-1">
          {!generatedContent ? (
            <>
              <div className="space-y-4 overflow-y-auto">
                <TemplateSelector
                  selectedTemplateId={selectedTemplateId}
                  onTemplateSelect={setSelectedTemplateId}
                />
              </div>
              <div className="space-y-4 overflow-y-auto">
                <FileSelector
                  profileId={profileId}
                  selectedFiles={selectedFiles}
                  onFilesSelect={setSelectedFiles}
                />
              </div>
            </>
          ) : (
            <div className="md:col-span-2">
              <ResultEditor
                content={generatedContent}
                onContentChange={setGeneratedContent}
                title={noteTitle}
                onTitleChange={setNoteTitle}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          {!generatedContent ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleGenerate} 
                disabled={!selectedTemplateId || selectedFiles.length === 0 || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  "Générer une note"
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setGeneratedContent("")}>
                Retour
              </Button>
              <Button variant="outline" onClick={() => {
                navigator.clipboard.writeText(generatedContent);
                toast({
                  title: "Copié !",
                  description: "Le contenu a été copié dans le presse-papier"
                });
              }}>
                Copier
              </Button>
              <Button variant="outline" onClick={() => {
                const element = document.createElement("a");
                const file = new Blob([generatedContent], {type: 'text/plain'});
                element.href = URL.createObjectURL(file);
                element.download = `${noteTitle}.txt`;
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
              }}>
                Exporter (.txt)
              </Button>
              <Button onClick={handleSaveNote} disabled={saveNote.isPending}>
                {saveNote.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  "Sauvegarder"
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
