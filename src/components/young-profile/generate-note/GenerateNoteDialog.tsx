
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
import { FileContent, SaveNoteParams, NOTE_TYPES, NoteType } from "@/types/note-generation";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { format } from "date-fns";

interface GenerateNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
}

export function GenerateNoteDialog({ open, onOpenChange, profileId }: GenerateNoteDialogProps) {
  const [activeTab, setActiveTab] = useState<string>("folders");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [noteType, setNoteType] = useState<NoteType>('general');
  const [periodStart, setPeriodStart] = useState<Date | undefined>(new Date());
  const [periodEnd, setPeriodEnd] = useState<Date | undefined>(new Date());
  const { toast } = useToast();
  
  const { 
    handleGenerate,
    isGenerating,
    generatedContent,
    saveNote,
    handleReset,
    noteTitle,
    setNoteTitle,
    setGeneratedContent
  } = useNoteGeneration({ 
    profileId,
    onSuccess: () => onOpenChange(false)
  });
  
  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setSelectedFiles([]);
        setSelectedTemplateId(null);
        setActiveTab("folders");
        setNoteType('general');
        setPeriodStart(new Date());
        setPeriodEnd(new Date());
        handleReset();
      }, 300); // Small delay to allow dialog close animation
    }
  }, [open, handleReset]);
  
  const handleFileSelect = (fileId: string) => {
    // Find the file in selectedFiles
    const existingIndex = selectedFiles.indexOf(fileId);
    if (existingIndex >= 0) {
      // Remove if already selected
      setSelectedFiles(selectedFiles.filter(id => id !== fileId));
    } else {
      // Add if not selected
      setSelectedFiles([...selectedFiles, fileId]);
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
      files: selectedFiles.map(id => ({ 
        id, 
        name: id, 
        content: '',
        type: '',
        folderName: ''
      })),
      templateId: selectedTemplateId,
      metadata: {
        type: noteType,
        periodStart: periodStart ? format(periodStart, 'yyyy-MM-dd') : undefined,
        periodEnd: periodEnd ? format(periodEnd, 'yyyy-MM-dd') : undefined
      }
    });
  };
  
  const handleSave = async () => {
    if (!noteTitle.trim() || !generatedContent.trim()) {
      toast({
        title: "Contenu requis",
        description: "Le titre et le contenu sont obligatoires",
        variant: "destructive"
      });
      return;
    }
    
    await saveNote.mutateAsync({ 
      title: noteTitle, 
      content: generatedContent,
      type: noteType,
      periodStart: periodStart ? format(periodStart, 'yyyy-MM-dd') : undefined,
      periodEnd: periodEnd ? format(periodEnd, 'yyyy-MM-dd') : undefined
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Générer une note de synthèse</DialogTitle>
        </DialogHeader>
        
        {generatedContent ? (
          <ResultEditor 
            noteTitle={noteTitle} 
            onTitleChange={setNoteTitle}
            generatedContent={generatedContent} 
            onContentChange={setGeneratedContent}
            onSave={handleSave}
            noteType={noteType}
            onNoteTypeChange={setNoteType}
            periodStart={periodStart}
            onPeriodStartChange={setPeriodStart}
            periodEnd={periodEnd}
            onPeriodEndChange={setPeriodEnd}
          />
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            <Tabs defaultValue="folders" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="mb-4">
                <TabsTrigger value="folders">Dossiers</TabsTrigger>
                <TabsTrigger value="templates">Modèles</TabsTrigger>
                <TabsTrigger value="settings">Paramètres</TabsTrigger>
              </TabsList>
              
              <TabsContent value="folders" className="flex-1 overflow-hidden">
                <FileSelector 
                  profileId={profileId}
                  onFileSelect={handleFileSelect}
                  selectedFiles={selectedFiles}
                />
              </TabsContent>
              
              <TabsContent value="templates" className="flex-1 overflow-hidden">
                <TemplateSelector 
                  selectedTemplateId={selectedTemplateId || ""}
                  onTemplateSelect={handleTemplateSelect}
                />
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="note-type">Type de note</Label>
                    <Select 
                      value={noteType} 
                      onValueChange={(value) => setNoteType(value as NoteType)}
                    >
                      <SelectTrigger id="note-type" className="w-full mt-1">
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        {NOTE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="period-start">Date de début</Label>
                      <DatePicker
                        id="period-start"
                        date={periodStart}
                        setDate={setPeriodStart}
                        placeholder="Date de début"
                      />
                    </div>
                    <div>
                      <Label htmlFor="period-end">Date de fin</Label>
                      <DatePicker
                        id="period-end"
                        date={periodEnd}
                        setDate={setPeriodEnd}
                        placeholder="Date de fin"
                      />
                    </div>
                  </div>
                </div>
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
                disabled={isGenerating || (selectedFiles.length === 0 && !selectedTemplateId)}
              >
                {isGenerating ? (
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
