
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2, Download, FileQuestion } from "lucide-react";
import { useState } from "react";

interface TemplatePreviewDialogProps {
  templateId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplatePreviewDialog({
  templateId,
  open,
  onOpenChange,
}: TemplatePreviewDialogProps) {
  const [showWordAlert, setShowWordAlert] = useState(false);
  
  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ['template', templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!templateId && open,
  });

  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ['template_sections', templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('template_sections')
        .select('*')
        .eq('template_id', templateId)
        .order('order_index');
      
      if (error) throw error;
      return data;
    },
    enabled: !!templateId && open && template?.template_type !== "word",
  });

  const isLoading = templateLoading || (template?.template_type !== "word" && sectionsLoading);

  const handleDownloadWord = () => {
    if (template?.word_file_url) {
      window.open(template.word_file_url, '_blank');
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (template?.word_file_url) {
      return (
        <div className="mb-4 p-3 border rounded-md bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileQuestion className="h-5 w-5 text-primary" />
              <span className="font-medium">{template.word_file_name || "Template Word"}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              asChild
            >
              <a 
                href={template.word_file_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Télécharger
              </a>
            </Button>
          </div>
        </div>
      );
    }

    if (sections.length > 0) {
      return (
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.id} className="space-y-2">
              <h3 className="text-lg font-medium">{section.title}</h3>
              {section.instructions && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{section.instructions}</p>
              )}
            </div>
          ))}
        </div>
      );
    }
    
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucune section disponible pour ce template
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{template?.title || "Aperçu du template"}</DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            {renderContent()}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showWordAlert} onOpenChange={setShowWordAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Prévisualisation non disponible</AlertDialogTitle>
            <AlertDialogDescription>
              Les templates Word ne peuvent pas être prévisualisés directement. Vous pouvez télécharger le fichier pour le visualiser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDownloadWord}>
              Télécharger
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
