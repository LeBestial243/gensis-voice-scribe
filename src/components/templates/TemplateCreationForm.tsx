
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { TemplateHeader } from "./template-form/TemplateHeader";
import { SectionsList } from "./template-form/SectionsList";
import { TemplateActions } from "./template-form/TemplateActions";
import { WordTemplateUpload } from "./template-form/WordTemplateUpload";

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
  const [wordFileUrl, setWordFileUrl] = useState<string | null>(null);
  const [wordFileName, setWordFileName] = useState<string | null>(null);
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
      setWordFileUrl(templateData.template.word_file_url || null);
      setWordFileName(templateData.template.word_file_name || null);
      
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
      setWordFileUrl(null);
      setWordFileName(null);
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
              user_id: user.id,
              word_file_url: wordFileUrl,
              word_file_name: wordFileName
            })
            .select()
            .single();
          
          if (templateError) throw templateError;
          templateId = templateData.id;
        } else {
          // Update existing template
          const { error: updateError } = await supabase
            .from('templates')
            .update({ 
              title: templateTitle,
              word_file_url: wordFileUrl,
              word_file_name: wordFileName
            })
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
        setWordFileUrl(null);
        setWordFileName(null);
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

  const handleFileUploaded = (fileUrl: string, fileName: string) => {
    setWordFileUrl(fileUrl);
    setWordFileName(fileName);
  };

  const handleFileRemoved = () => {
    setWordFileUrl(null);
    setWordFileName(null);
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
      <TemplateHeader 
        templateTitle={templateTitle}
        setTemplateTitle={setTemplateTitle}
      />

      <div className="p-4 border rounded-md bg-muted/30">
        <h3 className="text-lg font-medium mb-4">Template Word (Optionnel)</h3>
        <WordTemplateUpload
          templateId={editingTemplateId}
          existingFileUrl={wordFileUrl}
          existingFileName={wordFileName}
          onFileUploaded={handleFileUploaded}
          onFileRemoved={handleFileRemoved}
        />
        <p className="text-sm text-muted-foreground mt-4">
          Vous pouvez télécharger un fichier Word (.doc ou .docx) qui servira de modèle pour ce template.
        </p>
      </div>

      <SectionsList
        sections={sections}
        onAddSection={handleAddSection}
        onRemoveSection={handleRemoveSection}
        onSectionChange={handleSectionChange}
        onDragEnd={handleDragEnd}
      />

      <TemplateActions
        onSave={() => saveTemplate.mutate()}
        onCancel={onEditComplete}
        isSubmitting={isSubmitting}
        isEditing={!!editingTemplateId}
      />
    </div>
  );
}
