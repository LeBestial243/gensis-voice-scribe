
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

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
    enabled: !!templateId && open,
  });

  const isLoading = templateLoading || sectionsLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{template?.title || "Aperçu du template"}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4">
            {sections.length > 0 ? (
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
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Aucune section disponible pour ce template
              </div>
            )}
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
