
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [generatedContent, setGeneratedContent] = useState("");
  const [noteTitle, setNoteTitle] = useState("Note IA - " + format(new Date(), "PPP", { locale: fr }));
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch template sections when a template is selected
  const { data: templateSections = [] } = useQuery({
    queryKey: ['template_sections', selectedTemplateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('template_sections')
        .select('*')
        .eq('template_id', selectedTemplateId)
        .order('order_index');
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedTemplateId,
  });

  // Fetch profile data
  const { data: profile } = useQuery({
    queryKey: ['young_profile', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('young_profiles')
        .select('*')
        .eq('id', profileId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch files for the profile
  const { data: files = [] } = useQuery({
    queryKey: ['files_for_generation', profileId],
    queryFn: async () => {
      // First fetch folders
      const { data: folders } = await supabase
        .from('folders')
        .select('id')
        .eq('profile_id', profileId);
      
      if (!folders) return [];
      
      // Then fetch files in those folders
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .in('folder_id', folders.map(f => f.id))
        .eq('type', 'text/plain')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Save note mutation
  const saveNote = useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      const { data, error } = await supabase
        .from('notes')
        .insert([{ 
          title, 
          content, 
          user_id: profile?.user_id,
          template_id: selectedTemplateId || null
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast({
        title: "Note sauvegardée",
        description: "La note IA a été sauvegardée avec succès"
      });
      handleReset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la note: " + (error as Error).message,
        variant: "destructive"
      });
    }
  });

  const handleGenerate = async () => {
    if (!selectedTemplateId || selectedFiles.length === 0 || !profile) {
      toast({
        title: "Données manquantes",
        description: "Veuillez sélectionner un template et au moins un fichier",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Get content of selected files
      const selectedFilesContent = await Promise.all(
        selectedFiles.map(async (fileId) => {
          const file = files.find(f => f.id === fileId);
          return file?.content || "";
        })
      );

      // Call our edge function
      const { data, error } = await supabase.functions.invoke('generate-note', {
        body: {
          transcriptions: selectedFilesContent.filter(Boolean),
          templateSections,
          profileData: profile
        }
      });

      if (error) throw error;

      setGeneratedContent(data.content);
      setActiveStep("result");

    } catch (error) {
      toast({
        title: "Erreur de génération",
        description: "Une erreur est survenue lors de la génération de la note",
        variant: "destructive"
      });
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileSelect = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId) 
        : [...prev, fileId]
    );
  };

  const handleReset = () => {
    setSelectedTemplateId("");
    setSelectedFiles([]);
    setGeneratedContent("");
    setActiveStep("template");
    setNoteTitle("Note IA - " + format(new Date(), "PPP", { locale: fr }));
  };

  const handleSave = () => {
    if (!generatedContent) {
      toast({
        title: "Contenu manquant",
        description: "Veuillez d'abord générer une note",
        variant: "destructive"
      });
      return;
    }
    
    saveNote.mutate({ 
      title: noteTitle, 
      content: generatedContent 
    });
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
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Sélectionner un template</Label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTemplateId && templateSections.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Aperçu des sections</CardTitle>
                    <CardDescription>
                      Structure de la note qui sera générée
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {templateSections.map((section) => (
                        <div key={section.id} className="space-y-1">
                          <h4 className="font-medium">{section.title}</h4>
                          {section.instructions && (
                            <p className="text-sm text-muted-foreground">
                              {section.instructions}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={() => setActiveStep("files")}
                  disabled={!selectedTemplateId}
                >
                  Suivant
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="files">
            <div className="space-y-4">
              <Label>Sélectionner les fichiers à utiliser</Label>
              <ScrollArea className="h-[400px] rounded-md border p-4">
                <div className="space-y-4">
                  {files.length === 0 ? (
                    <p className="text-center text-muted-foreground">
                      Aucun fichier disponible
                    </p>
                  ) : (
                    files.map((file) => (
                      <div key={file.id} className="flex items-start space-x-3">
                        <Checkbox
                          id={file.id}
                          checked={selectedFiles.includes(file.id)}
                          onCheckedChange={() => handleFileSelect(file.id)}
                        />
                        <Label
                          htmlFor={file.id}
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          <div className="font-medium mb-1">{file.name}</div>
                          <div className="text-muted-foreground text-xs">
                            {format(new Date(file.created_at || ''), "PPP", { locale: fr })}
                          </div>
                          {file.content && (
                            <div className="mt-1 text-sm text-muted-foreground line-clamp-2">
                              {file.content}
                            </div>
                          )}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setActiveStep("template")}
                >
                  Retour
                </Button>
                <Button
                  onClick={handleGenerate}
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
            </div>
          </TabsContent>

          <TabsContent value="result">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="note-title">Titre de la note</Label>
                <input
                  id="note-title"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="generated-content">Contenu généré</Label>
                <Textarea
                  id="generated-content"
                  value={generatedContent}
                  onChange={(e) => setGeneratedContent(e.target.value)}
                  className="min-h-[300px]"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {activeStep === "result" && (
            <>
              <div className="flex-1 flex gap-2">
                <Button variant="outline" onClick={handleCopy}>
                  Copier
                </Button>
                <Button variant="outline" onClick={handleExport}>
                  Exporter
                </Button>
              </div>
              <Button onClick={handleSave}>
                Sauvegarder
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
