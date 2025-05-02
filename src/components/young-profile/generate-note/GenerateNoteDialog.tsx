
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
  const { toast } = useToast();
  
  const { 
    generateNote, 
    isLoading, 
    result,
    saveNote,
    isSaving,
    reset
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
  
  const handleFileSelect = (file: FileContent) => {
    // Check if already selected
    if (selectedFiles.some(f => f.id === file.id)) {
      setSelectedFiles(selectedFiles.filter(f => f.id !== file.id));
    } else {
      setSelectedFiles([...selectedFiles, file]);
    }
  };
  
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId === selectedTemplateId ? null : templateId);
  };
  
  const handleGenerate = async () => {
    if (selectedFiles.length === 0 && !selectedTemplateId) {
      toast({
        title: "Sélection requise",
        description: "Veuillez sélectionner au moins un fichier ou un modèle",
        variant: "destructive"
      });
      return;
    }
    
    await generateNote({
      files: selectedFiles,
      templateId: selectedTemplateId
    });
  };
  
  const handleSave = async ({ title, content }: SaveNoteParams) => {
    await saveNote({ 
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
            content={result} 
            onSave={handleSave} 
            onBack={() => reset()}
            isSaving={isSaving}
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
                  selectedFiles={selectedFiles}
                />
              </TabsContent>
              
              <TabsContent value="templates" className="flex-1 overflow-hidden">
                <TemplateSelector 
                  selectedTemplateId={selectedTemplateId} 
                  onSelect={handleTemplateSelect}
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
                onClick={handleGenerate} 
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
