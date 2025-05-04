
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { StructureSelector } from './StructureSelector';
import { Template } from '@/types/reports';

interface TemplatesListProps {
  onSelect: (templateId: string) => void;
  onEdit?: (template: Template) => void;
  onDelete?: (templateId: string) => void;
  onCreate?: () => void;
  showStructureFilter?: boolean;
}

export function TemplatesList({
  onSelect,
  onEdit,
  onDelete,
  onCreate,
  showStructureFilter = false,
}: TemplatesListProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  // Load templates
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...templates];
    
    // Filter by structure if selected
    if (selectedStructureId) {
      filtered = filtered.filter(template => template.structure_id === selectedStructureId);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template => 
        template.title.toLowerCase().includes(query) || 
        template.description?.toLowerCase().includes(query)
      );
    }
    
    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedStructureId]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process templates to include structure names
      const processedTemplates = await Promise.all(data.map(async (template: Template) => {
        if (template.structure_id) {
          try {
            const { data: structureData } = await supabase
              .from('structures')
              .select('name')
              .eq('id', template.structure_id)
              .single();
            
            return { 
              ...template, 
              structure_name: structureData?.name || 'Unknown' 
            };
          } catch (e) {
            return {
              ...template,
              structure_name: 'Unknown'
            };
          }
        }
        return { ...template, structure_name: 'Global' };
      }));

      setTemplates(processedTemplates);
      setFilteredTemplates(processedTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les templates',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Template supprimé avec succès',
      });

      // Refresh templates list
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le template',
        variant: 'destructive',
      });
    } finally {
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1">
          <Label htmlFor="search-templates">Rechercher</Label>
          <Input
            id="search-templates"
            placeholder="Rechercher un template..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {showStructureFilter && (
          <div className="w-full md:w-1/3">
            <Label>Structure</Label>
            <StructureSelector
              value={selectedStructureId}
              onChange={setSelectedStructureId}
              includeAllOption
            />
          </div>
        )}
        
        {onCreate && (
          <Button className="shrink-0" onClick={onCreate}>
            Créer un nouveau template
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Aucun template trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-start">
                  <span className="text-lg truncate">{template.title}</span>
                  {template.is_default && (
                    <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                      Par défaut
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {template.structure_name && (
                    <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded">
                      {template.structure_name}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-2">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.description || "Pas de description"}
                </p>
              </CardContent>
              <div className="p-4 pt-0 mt-auto flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => onSelect(template.id)}>
                  Sélectionner
                </Button>
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(template)}
                  >
                    Éditer
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setConfirmDeleteId(template.id)}
                  >
                    Supprimer
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Confirmation dialog */}
      <Dialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p>Êtes-vous sûr de vouloir supprimer ce template ? Cette action est irréversible.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmDeleteId && handleDeleteTemplate(confirmDeleteId)}
            >
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
