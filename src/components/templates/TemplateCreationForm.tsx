
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical, Save } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface Section {
  id: string;
  title: string;
  instructions: string;
}

interface TemplateCreationFormProps {
  editingTemplateId: string | null;
  onEditComplete: () => void;
}

export function TemplateCreationForm({ editingTemplateId, onEditComplete }: TemplateCreationFormProps) {
  const [templateTitle, setTemplateTitle] = useState("");
  const [sections, setSections] = useState<Section[]>([
    { id: "section-" + Date.now(), title: "", instructions: "" }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load template data if editing
  const { data: templateData, isLoading: templateLoading } = useQuery({
    queryKey: ['template', editingTemplateId],
    queryFn: async () => {
      if (!editingTemplateId) return null;

      const { data: template, error: templateError } = await supabase
        .from('templates')
        .select('*')
        .eq('id', editingTemplateId)
        .single();
      
      if (templateError) throw templateError;

      const { data: sections, error: sectionsError } = await supabase
        .from('template_sections')
        .select('*')
        .eq('template_id', editingTemplateId)
        .order('order_index');
      
      if (sectionsError) throw sectionsError;

      return { template, sections };
    },
    enabled: !!editingTemplateId,
  });

  // Set form data when editing template
  useEffect(() => {
    if (templateData) {
      setTemplateTitle(templateData.template.title);
      
      if (templateData.sections.length > 0) {
        setSections(templateData.sections.map(section => ({
          id: section.id,
          title: section.title,
          instructions: section.instructions || ""
        })));
      }
    }
  }, [templateData]);

  // Reset form when editingTemplateId changes
  useEffect(() => {
    if (!editingTemplateId) {
      setTemplateTitle("");
      setSections([{ id: "section-" + Date.now(), title: "", instructions: "" }]);
    }
  }, [editingTemplateId]);

  const saveTemplate = useMutation({
    mutationFn: async () => {
      setIsSubmitting(true);

      try {
        // Validate the form
        if (!templateTitle.trim()) {
          throw new Error("Le titre du template est requis");
        }

        const validSections = sections.filter(s => s.title.trim());
        if (validSections.length === 0) {
          throw new Error("Au moins une section avec un titre est requise");
        }

        let templateId = editingTemplateId;

        // If creating new template
        if (!editingTemplateId) {
          // Get the current user ID
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Utilisateur non authentifié");
          
          const { data: templateData, error: templateError } = await supabase
            .from('templates')
            .insert({
              title: templateTitle,
              user_id: user.id
            })
            .select()
            .single();
          
          if (templateError) throw templateError;
          templateId = templateData.id;
        } else {
          // Update existing template
          const { error: updateError } = await supabase
            .from('templates')
            .update({ title: templateTitle })
            .eq('id', editingTemplateId);
          
          if (updateError) throw updateError;

          // Delete existing sections
          const { error: deleteError } = await supabase
            .from('template_sections')
            .delete()
            .eq('template_id', editingTemplateId);
          
          if (deleteError) throw deleteError;
        }

        // Add sections
        const sectionsToInsert = validSections.map((section, index) => ({
          template_id: templateId,
          title: section.title,
          instructions: section.instructions || null,
          order_index: index
        }));

        const { error: sectionsError } = await supabase
          .from('template_sections')
          .insert(sectionsToInsert);
        
        if (sectionsError) throw sectionsError;

        return templateId;
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({
        title: editingTemplateId ? "Template mis à jour" : "Template créé",
        description: editingTemplateId 
          ? "Votre template a été mis à jour avec succès"
          : "Votre nouveau template a été créé avec succès"
      });

      // Reset form if creating new template
      if (!editingTemplateId) {
        setTemplateTitle("");
        setSections([{ id: "section-" + Date.now(), title: "", instructions: "" }]);
      } else {
        onEditComplete();
      }
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: (error as Error).message || "Une erreur est survenue",
        variant: "destructive"
      });
    }
  });

  const handleAddSection = () => {
    setSections([...sections, { id: "section-" + Date.now(), title: "", instructions: "" }]);
  };

  const handleRemoveSection = (index: number) => {
    if (sections.length === 1) {
      toast({
        title: "Au moins une section requise",
        description: "Vous devez avoir au moins une section dans votre template",
        variant: "destructive"
      });
      return;
    }
    
    const newSections = [...sections];
    newSections.splice(index, 1);
    setSections(newSections);
  };

  const handleSectionChange = (index: number, field: 'title' | 'instructions', value: string) => {
    const newSections = [...sections];
    newSections[index][field] = value;
    setSections(newSections);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setSections(items);
  };

  if (templateLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="template-title">Titre du template</Label>
        <Input
          id="template-title"
          value={templateTitle}
          onChange={(e) => setTemplateTitle(e.target.value)}
          placeholder="Ex: Rapport d'entretien individuel"
          className="max-w-md"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Sections du template</h3>
          <Button type="button" onClick={handleAddSection} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Ajouter une section
          </Button>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sections">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-4"
                >
                  {sections.map((section, index) => (
                    <Draggable key={section.id} draggableId={section.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="border rounded-md p-4 bg-card"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="font-medium">Section {index + 1}</div>
                            <div className="flex items-center gap-2">
                              <div {...provided.dragHandleProps} className="cursor-grab">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveSection(index)}
                                className="h-8 w-8 p-0 text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Supprimer</span>
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor={`section-${index}-title`}>Titre de la section</Label>
                              <Input
                                id={`section-${index}-title`}
                                value={section.title}
                                onChange={(e) => handleSectionChange(index, 'title', e.target.value)}
                                placeholder="Ex: Contexte de l'entretien"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`section-${index}-instructions`}>
                                Instructions pour l'IA (optionnel)
                              </Label>
                              <Textarea
                                id={`section-${index}-instructions`}
                                value={section.instructions}
                                onChange={(e) => handleSectionChange(index, 'instructions', e.target.value)}
                                placeholder="Ex: Résumer le contexte de l'échange en 3-4 phrases, mentionner le lieu et l'ambiance"
                                rows={3}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </ScrollArea>
      </div>

      <div className="flex justify-end pt-4">
        {editingTemplateId && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onEditComplete} 
            className="mr-2"
          >
            Annuler
          </Button>
        )}
        <Button
          type="button"
          onClick={() => saveTemplate.mutate()}
          disabled={isSubmitting}
        >
          <Save className="h-4 w-4 mr-1" />
          {editingTemplateId ? "Mettre à jour" : "Enregistrer le template"}
        </Button>
      </div>
    </div>
  );
}
