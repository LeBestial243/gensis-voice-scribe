
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { TemplatePreviewDialog } from "./TemplatePreviewDialog";
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

interface TemplatesListProps {
  onEditTemplate: (templateId: string) => void;
}

export function TemplatesList({ onEditTemplate }: TemplatesListProps) {
  const { toast } = useToast();
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);

  const { data: templates = [], isLoading, refetch } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('templates')
        .select(`
          id, 
          title, 
          description,
          created_at,
          template_sections:template_sections(count)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      return data.map(template => ({
        ...template,
        sectionCount: template.template_sections[0]?.count || 0
      }));
    },
  });

  const handleDeleteTemplate = async () => {
    if (!deleteTemplateId) return;

    try {
      // First delete sections
      const { error: sectionsError } = await supabase
        .from('template_sections')
        .delete()
        .eq('template_id', deleteTemplateId);

      if (sectionsError) throw sectionsError;

      // Then delete the template
      const { error: templateError } = await supabase
        .from('templates')
        .delete()
        .eq('id', deleteTemplateId);

      if (templateError) throw templateError;

      toast({
        title: "Template supprimé",
        description: "Le template a été supprimé avec succès"
      });

      refetch();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le template",
        variant: "destructive"
      });
      console.error('Delete error:', error);
    } finally {
      setDeleteTemplateId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Vous n'avez pas encore créé de template.</p>
          <p className="mt-2">Utilisez le formulaire ci-dessus pour créer votre premier template.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Templates existants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="overflow-hidden">
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">{template.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-muted-foreground mb-4">
                    {template.sectionCount} {template.sectionCount > 1 ? 'sections' : 'section'}
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setPreviewTemplateId(template.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Aperçu
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onEditTemplate(template.id)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setDeleteTemplateId(template.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {previewTemplateId && (
        <TemplatePreviewDialog
          templateId={previewTemplateId}
          open={!!previewTemplateId}
          onOpenChange={(open) => !open && setPreviewTemplateId(null)}
        />
      )}

      <AlertDialog open={!!deleteTemplateId} onOpenChange={(open) => !open && setDeleteTemplateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le template et toutes ses sections seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTemplate} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
