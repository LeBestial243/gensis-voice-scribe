
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface RenameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  newFileName: string;
  onNewFileNameChange: (value: string) => void;
  isRenaming: boolean;
}

export function RenameDialog({
  isOpen,
  onClose,
  onConfirm,
  newFileName,
  onNewFileNameChange,
  isRenaming,
}: RenameDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Renommer le fichier</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="fileName">Nouveau nom</Label>
            <Input
              id="fileName"
              value={newFileName}
              onChange={(e) => onNewFileNameChange(e.target.value)}
              placeholder="Entrez le nouveau nom du fichier"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onConfirm();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
          >
            Annuler
          </Button>
          <Button 
            type="button" 
            onClick={onConfirm}
            disabled={!newFileName.trim() || isRenaming}
          >
            {isRenaming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Renommage...
              </>
            ) : (
              "Renommer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

