
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface FolderHeaderProps {
  onCreateFolder: () => void;
}

export function FolderHeader({ onCreateFolder }: FolderHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-bold">Dossiers</h2>
      <Button 
        onClick={onCreateFolder}
        className="bg-primary text-white hover:bg-primary/90"
      >
        <Plus className="h-4 w-4 mr-2" />
        Créer un dossier
      </Button>
    </div>
  );
}
