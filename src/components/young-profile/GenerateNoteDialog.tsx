
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
  const [generatedContent, setGeneratedContent] = useState("");
  const [noteTitle, setNoteTitle] = useState("Note IA - " + new Date().toLocaleDateString('fr-FR'));
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch files for the profile
  const { data: files = [] } = useQuery({
    queryKey: ['all_files_for_profile', profileId],
    queryFn: async () => {
      // First fetch folders for this profile
      const { data: folders } = await supabase
        .from('folders')
        .select('id')
        .eq('profile_id', profileId);
      
      if (!folders || folders.length === 0) return [];
      
      const folderIds = folders.map(f => f.id);
      
      // Then fetch files in those folders
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .in('folder_id', folderIds)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Mutation to save a note
  const saveNote = useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      const { data, error } = await supabase
        .from('notes')
        .insert([
          { title, content, user_id: profileId }
        ])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', profileId] });
      toast({
        title: "Note sauvegardée",
        description: "La note IA a été sauvegardée avec succès"
      });
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

  // Handle generating IA note (mock for now)
  const handleGenerate = () => {
    setIsGenerating(true);
    
    // Mock AI generation - in a real app, you would call an API here
    setTimeout(() => {
      const mockContent = `# Synthèse du dossier
      
## Contexte
L'enfant montre des progrès significatifs dans plusieurs domaines clés. Les observations récentes indiquent une amélioration de la concentration et de la participation aux activités de groupe.

## Points forts
- Capacité accrue à suivre des instructions complexes
- Amélioration des compétences de communication
- Développement de la confiance en soi dans les activités structurées

## Points d'attention
- Besoin de soutien supplémentaire dans la gestion des émotions fortes
- Difficultés persistantes dans certaines situations sociales
- Nécessité d'un cadre stable et prévisible

## Recommandations
1. Maintenir la structure actuelle qui fonctionne bien
2. Proposer des moments individuels réguliers pour travailler sur les compétences ciblées
3. Renforcer la collaboration avec la famille pour assurer une continuité
4. Envisager une évaluation plus approfondie dans les domaines spécifiques identifiés
`;
      setGeneratedContent(mockContent);
      setIsGenerating(false);
    }, 2000);
  };

  const handleSave = () => {
    if (!generatedContent) {
      toast({
        title: "Erreur",
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

  const handleFileSelect = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId) 
        : [...prev, fileId]
    );
  };

  // Function to copy content to clipboard
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

  // Function to export as text file
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Générer une note IA</DialogTitle>
          <DialogDescription>
            Utilisez l'IA pour générer une synthèse à partir des informations du dossier.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
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
            <Label>Documents à utiliser pour la synthèse</Label>
            <div className="border rounded-md p-4 max-h-40 overflow-y-auto space-y-2">
              {files.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun document disponible pour ce profil
                </p>
              ) : (
                files.map((file) => (
                  <div key={file.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={file.id} 
                      checked={selectedFiles.includes(file.id)}
                      onCheckedChange={() => handleFileSelect(file.id)}
                    />
                    <Label htmlFor={file.id} className="text-sm font-normal cursor-pointer">
                      {file.name}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || selectedFiles.length === 0}
              className="mt-2"
            >
              {isGenerating ? "Génération en cours..." : "Générer une synthèse"}
            </Button>
          </div>

          {isGenerating && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          )}

          {generatedContent && (
            <div className="grid gap-2">
              <Label htmlFor="generated-content">Contenu généré</Label>
              <Textarea
                id="generated-content"
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                className="min-h-[300px]"
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {generatedContent && (
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
