
import { Button } from "@/components/ui/button";
import { Folder, Plus } from "lucide-react";

interface EmptyFolderStateProps {
  searchQuery?: string;
  onCreateFolder: () => void;
}

export function EmptyFolderState({ searchQuery, onCreateFolder }: EmptyFolderStateProps) {
  if (searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-lg bg-muted/50">
        <Folder className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Aucun résultat</h3>
        <p className="text-muted-foreground">
          Aucun dossier ne correspond à "{searchQuery}"
        </p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-lg bg-muted/50">
      <Folder className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">Aucun dossier</h3>
      <p className="text-muted-foreground">
        Créez votre premier dossier pour commencer à organiser vos fichiers
      </p>
      <Button 
        onClick={onCreateFolder} 
        className="mt-4"
        variant="outline"
      >
        <Plus className="h-4 w-4 mr-2" />
        Créer un dossier
      </Button>
    </div>
  );
}
