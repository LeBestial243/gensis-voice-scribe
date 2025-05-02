import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FolderSelector } from "./FolderSelector";
import { FileSelector } from "./FileSelector";
import { TemplateSelector } from "./TemplateSelector";
import { ResultEditor } from "./ResultEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNoteGeneration } from "@/hooks/use-note-generation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { FileContent, SaveNoteParams } from "@/types/note-generation";

interface GenerateNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
}

export function GenerateNoteDialog({ open, onOpenChange, profileId }: GenerateNoteDialogProps) {
  const [activeTab, setActiveTab] = useState<string>("folders");
  const [selectedFiles, setSelectedFiles] = useState<FileContent[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const { toast } = useToast();
  
  const { 
    handleGenerate,
    isGenerating: isLoading,
    generatedContent: result,
    saveNote,
    handleReset: reset,
    noteTitle,
    setNoteTitle
  } = useNoteGeneration({ profileId });
  
  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setSelectedFiles([]);
        setSelectedTemplateId(null);
        setActiveTab("folders");
        reset();
      }, 300); // Small delay to allow dialog close animation
    }
  }, [open, reset]);
  
  const handleFileSelect = (fileId: string) => {
    // Find the file in selectedFiles
    const existingIndex = selectedFiles.findIndex(f => f.id === fileId);
    if (existingIndex >= 0) {
      // Remove if already selected
      setSelectedFiles(selectedFiles.filter(f => f.id !== fileId));
    } else {
      // Otherwise we need to fetch the file and add it
      // For simplicity, we'll just add an empty file here
      // In a real implementation, you would fetch the file data
      const newFile: FileContent = {
        id: fileId,
        name: fileId,
        content: '',
        type: '',
        folderName: ''
      };
      setSelectedFiles([...selectedFiles, newFile]);
    }
  };
  
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId === selectedTemplateId ? null : templateId);
  };
  
  const handleGeneration = async () => {
    if (selectedFiles.length === 0 && !selectedTemplateId) {
      toast({
        title: "Sélection requise",
        description: "Veuillez sélectionner au moins un fichier ou un modèle",
        variant: "destructive"
      });
      return;
    }
    
    await handleGenerate({
      files: selectedFiles,
      templateId: selectedTemplateId
    });
  };
  
  const handleSave = async ({ title, content }: SaveNoteParams) => {
    await saveNote.mutateAsync({ 
      title, 
      content,
      type: "note"
    });
    
    onOpenChange(false);
    toast({
      title: "Note enregistrée",
      description: "La note a été ajoutée avec succès"
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Générer une note de synthèse</DialogTitle>
        </DialogHeader>
        
        {result ? (
          <ResultEditor 
            noteTitle={noteTitle} 
            onTitleChange={setNoteTitle}
            generatedContent={result} 
            onContentChange={setGeneratedContent}
          />
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            <Tabs defaultValue="folders" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="mb-4">
                <TabsTrigger value="folders">Dossiers</TabsTrigger>
                <TabsTrigger value="templates">Modèles</TabsTrigger>
              </TabsList>
              
              <TabsContent value="folders" className="flex-1 overflow-hidden">
                <FolderSelector 
                  profileId={profileId}
                  onFileSelect={handleFileSelect}
                  selectedFiles={selectedFiles.map(f => f.id)}
                />
              </TabsContent>
              
              <TabsContent value="templates" className="flex-1 overflow-hidden">
                <TemplateSelector 
                  selectedTemplateId={selectedTemplateId || ""}
                  onTemplateSelect={handleTemplateSelect}
                />
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end space-x-2 mt-4 pt-2 border-t">
              {selectedFiles.length > 0 && (
                <div className="text-sm text-muted-foreground flex items-center mr-auto">
                  {selectedFiles.length} fichier{selectedFiles.length > 1 ? 's' : ''} sélectionné{selectedFiles.length > 1 ? 's' : ''}
                </div>
              )}
              
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              
              <Button 
                onClick={handleGeneration} 
                disabled={isLoading || (selectedFiles.length === 0 && !selectedTemplateId)}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Génération...
                  </div>
                ) : 'Générer la note'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
