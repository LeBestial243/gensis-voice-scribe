
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { FileType } from "@/hooks/use-file-operations";

interface RenameDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileType | null;
  newFileName: string;
  onNewFileNameChange: (value: string) => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export function RenameDialog({
  isOpen,
  onOpenChange,
  file,
  newFileName,
  onNewFileNameChange,
  onConfirm,
  isLoading
}: RenameDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button 
            type="button" 
            onClick={onConfirm}
            disabled={!newFileName.trim() || isLoading}
          >
            {isLoading ? (
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
