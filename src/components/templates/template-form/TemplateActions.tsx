
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface TemplateActionsProps {
  onSave: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isEditing: boolean;
}

export function TemplateActions({
  onSave,
  onCancel,
  isSubmitting,
  isEditing
}: TemplateActionsProps) {
  return (
    <div className="flex justify-end pt-4">
      {isEditing && (
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          className="mr-2"
        >
          Annuler
        </Button>
      )}
      <Button
        type="button"
        onClick={onSave}
        disabled={isSubmitting}
      >
        <Save className="h-4 w-4 mr-1" />
        {isEditing ? "Mettre à jour" : "Enregistrer le template"}
      </Button>
    </div>
  );
}
