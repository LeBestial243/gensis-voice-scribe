
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2, Download, File, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
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

// Define types to match the database schema
interface Template {
  id: string;
  title: string;
  description: string;
  created_at: string;
  word_file_url: string | null;
  word_file_name: string | null;
  template_sections?: { count: number }[];
  structure_id?: string | null;
}

interface TransformedTemplate {
  id: string;
  title: string;
  description: string;
  created_at: string;
  word_template_url: string | null;
  word_template_filename: string | null;
  template_type: "word" | "sections";
  sectionCount: number;
  structure_id?: string | null;
}

export function TemplatesList({ onEditTemplate }: TemplatesListProps) {
  const { toast } = useToast();
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
          word_file_url,
          word_file_name,
          structure_id,
          template_sections(count)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Transform each template and safely handle template_sections
      return data.map(template => {
        // Create a new object with the template data
        const transformedTemplate: TransformedTemplate = {
          id: template.id,
          title: template.title,
          description: template.description,
          created_at: template.created_at,
          word_template_url: template.word_file_url, // Map from word_file_url
          word_template_filename: template.word_file_name, // Map from word_file_name
          template_type: "word", // Default to word
          sectionCount: 0, // Default to 0
          structure_id: template.structure_id
        };
        
        // Safely access template_sections if it exists
        if (template.template_sections && 
            Array.isArray(template.template_sections) && 
            template.template_sections.length > 0) {
          transformedTemplate.sectionCount = template.template_sections[0].count || 0;
        }
        
        return transformedTemplate;
      });
    },
  });

  const handleDeleteTemplate = async () => {
    if (!deleteTemplateId) return;

    try {
      const template = templates.find(t => t.id === deleteTemplateId);
      
      // Delete word template file if exists
      if (template?.word_template_url) {
        const fileName = template.word_template_url.split('/').pop();
        if (fileName) {
          const { error: storageError } = await supabase.storage
            .from('templates-files')
            .remove([`templates/${fileName}`]);
          
          if (storageError) {
            console.error('Storage delete error:', storageError);
          }
        }
      }

      // Delete sections
      const { error: sectionsError } = await supabase
        .from('template_sections')
        .delete()
        .eq('template_id', deleteTemplateId);

      if (sectionsError) throw sectionsError;

      // Delete the template
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

  const handleDownloadWord = (templateUrl: string) => {
    if (templateUrl) {
      window.open(templateUrl, '_blank');
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
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.title}</CardTitle>
                    <Badge variant={template.template_type === "word" ? "outline" : "secondary"}>
                      {template.template_type === "word" ? (
                        <File className="h-3 w-3 mr-1" />
                      ) : (
                        <List className="h-3 w-3 mr-1" />
                      )}
                      {template.template_type === "word" ? "Word" : "Sections"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {template.template_type === "word" ? (
                    <p className="text-sm text-muted-foreground mb-4">
                      {template.word_template_filename || "document.docx"}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground mb-4">
                      {template.sectionCount} {template.sectionCount > 1 ? 'sections' : 'section'}
                    </p>
                  )}
                  <div className="flex justify-end gap-2">
                    {template.word_template_url && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDownloadWord(template.word_template_url!)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Télécharger
                      </Button>
                    )}
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
