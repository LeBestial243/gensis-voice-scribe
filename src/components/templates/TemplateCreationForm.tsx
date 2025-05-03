
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TemplateHeader } from "./template-form/TemplateHeader";
import { TemplateActions } from "./template-form/TemplateActions";
import { WordTemplateUpload } from "./template-form/WordTemplateUpload";
import { StructureSelector } from "./template-form/StructureSelector";

interface TemplateCreationFormProps {
  editingTemplateId: string | null;
  onEditComplete: () => void;
}

export function TemplateCreationForm({ editingTemplateId, onEditComplete }: TemplateCreationFormProps) {
  const [templateTitle, setTemplateTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wordFileUrl, setWordFileUrl] = useState<string | null>(null);
  const [wordFileName, setWordFileName] = useState<string | null>(null);
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null);
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
      
      return { template };
    },
    enabled: !!editingTemplateId,
  });

  // Set form data when editing template
  useEffect(() => {
    if (templateData) {
      setTemplateTitle(templateData.template.title);
      setWordFileUrl(templateData.template.word_file_url || null);
      setWordFileName(templateData.template.word_file_name || null);
      setSelectedStructureId(templateData.template.structure_id);
    }
  }, [templateData]);

  // Reset form when editingTemplateId changes
  useEffect(() => {
    if (!editingTemplateId) {
      setTemplateTitle("");
      setWordFileUrl(null);
      setWordFileName(null);
      setSelectedStructureId(null);
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
        
        if (!wordFileUrl) {
          throw new Error("Un fichier Word est requis pour le template");
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
              word_file_name: wordFileName,
              structure_id: selectedStructureId
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
              word_file_name: wordFileName,
              structure_id: selectedStructureId
            })
            .eq('id', editingTemplateId);
          
          if (updateError) throw updateError;
        }

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
        setSelectedStructureId(null);
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

  const handleFileUploaded = (fileUrl: string, fileName: string) => {
    setWordFileUrl(fileUrl);
    setWordFileName(fileName);
  };

  const handleFileRemoved = () => {
    setWordFileUrl(null);
    setWordFileName(null);
  };

  const handleStructureChange = (structureId: string | null) => {
    setSelectedStructureId(structureId);
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

      <div className="space-y-6">
        <StructureSelector 
          selectedStructureId={selectedStructureId} 
          onStructureChange={handleStructureChange}
        />

        <div className="p-4 border rounded-md bg-muted/30">
          <h3 className="text-lg font-medium mb-4">Template Word</h3>
          <WordTemplateUpload
            templateId={editingTemplateId}
            existingFileUrl={wordFileUrl}
            existingFileName={wordFileName}
            onFileUploaded={handleFileUploaded}
            onFileRemoved={handleFileRemoved}
          />
          <p className="text-sm text-muted-foreground mt-4">
            Téléchargez un fichier Word (.doc ou .docx) qui servira de modèle pour ce template.
          </p>
        </div>
      </div>

      <TemplateActions
        onSave={() => saveTemplate.mutate()}
        onCancel={onEditComplete}
        isSubmitting={isSubmitting}
        isEditing={!!editingTemplateId}
      />
    </div>
  );
}
