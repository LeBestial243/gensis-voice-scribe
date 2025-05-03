import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2, Download, File, Building } from "lucide-react";
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Structure } from "@/types/structures";
import { structureService } from "@/services/structureService";

// Define types to match the database schema
interface Template {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  word_file_url: string | null;
  word_file_name: string | null;
  structure_id: string | null;
}

interface TransformedTemplate {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  word_template_url: string | null;
  word_template_filename: string | null;
  structure_id: string | null;
  structure_name: string | null;
}

interface TemplatesListProps {
  onEditTemplate: (templateId: string) => void;
}

export function TemplatesList({ onEditTemplate }: TemplatesListProps) {
  const { toast } = useToast();
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null);
  
  // Fetch available structures
  const { data: structures = [] } = useQuery({
    queryKey: ['structures'],
    queryFn: async () => {
      return structureService.getStructures();
    },
  });

  const { data: templates = [], isLoading, refetch } = useQuery({
    queryKey: ['templates', selectedStructureId],
    queryFn: async () => {
      let query = supabase
        .from('templates')
        .select(`
          id, 
          title, 
          description,
          created_at,
          word_file_url,
          word_file_name,
          structure_id
        `)
        .order('created_at', { ascending: false });
      
      // Filter by structure if selected
      if (selectedStructureId) {
        query = query.eq('structure_id', selectedStructureId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;

      // Transform each template
      const transformedTemplates = await Promise.all((data || []).map(async (template: Template): Promise<TransformedTemplate> => {
        let structureName = null;
        
        if (template.structure_id) {
          try {
            // Find structure in the fetched structures
            const structure = structures.find(s => s.id === template.structure_id);
            structureName = structure ? structure.name : null;
          } catch (error) {
            console.error('Error fetching structure:', error);
          }
        }
        
        return {
          id: template.id,
          title: template.title,
          description: template.description,
          created_at: template.created_at,
          word_template_url: template.word_file_url,
          word_template_filename: template.word_file_name,
          structure_id: template.structure_id,
          structure_name: structureName,
        };
      }));
      
      return transformedTemplates;
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

  const handleStructureChange = (structureId: string) => {
    setSelectedStructureId(structureId === "all" ? null : structureId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="space-y-2">
              <Label htmlFor="structure-filter">Filtrer par structure</Label>
              <Select 
                value={selectedStructureId || "all"} 
                onValueChange={handleStructureChange}
              >
                <SelectTrigger id="structure-filter" className="w-60">
                  <SelectValue placeholder="Toutes les structures" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les structures</SelectItem>
                  {structures.map((structure) => (
                    <SelectItem key={structure.id} value={structure.id}>
                      {structure.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Templates existants</CardTitle>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Aucun template trouvé</p>
              {selectedStructureId && (
                <p className="mt-2">Essayez de modifier votre filtre ou créez un nouveau template</p>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card key={template.id} className="overflow-hidden">
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{template.title}</CardTitle>
                      <Badge variant="outline">
                        <File className="h-3 w-3 mr-1" />
                        Word
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {template.structure_name && (
                      <div className="mb-2 flex items-center">
                        <Building className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {template.structure_name}
                        </span>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground mb-4">
                      {template.word_template_filename || "document.docx"}
                    </p>
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
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTemplateId} onOpenChange={(open) => !open && setDeleteTemplateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le template sera définitivement supprimé.
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
