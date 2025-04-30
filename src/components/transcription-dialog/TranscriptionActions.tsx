
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface TranscriptionActionsProps {
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
  hasError: boolean;
  hasSelectedFolder: boolean;
}

export function TranscriptionActions({ 
  onSave, 
  onCancel, 
  isPending,
  hasError,
  hasSelectedFolder
}: TranscriptionActionsProps) {
  return (
    <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
      <Button 
        variant="outline" 
        onClick={onCancel}
        disabled={isPending}
      >
        Annuler
      </Button>
      <Button 
        onClick={onSave}
        disabled={isPending || !hasSelectedFolder}
        variant={hasError ? "destructive" : "default"}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enregistrement...
          </>
        ) : (
          hasError ? 
            "Valider malgré l'erreur" : 
            "Valider et classer"
        )}
      </Button>
    </div>
  );
}
