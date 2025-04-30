
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UploadCloud } from "lucide-react";

interface UploadFileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadFile: (file: File) => void;
  isPending: boolean;
  folderId: string | null;
}

export function UploadFileDialog({ 
  isOpen, 
  onOpenChange, 
  onUploadFile,
  isPending,
  folderId
}: UploadFileDialogProps) {
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  const handleSubmit = () => {
    if (fileToUpload) {
      onUploadFile(fileToUpload);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setFileToUpload(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un fichier</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="file">Sélectionner un fichier</Label>
            <Input
              id="file"
              type="file"
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  setFileToUpload(files[0]);
                }
              }}
            />
            {fileToUpload && (
              <p className="text-sm text-muted-foreground">
                Fichier sélectionné: {fileToUpload.name} ({(fileToUpload.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
          >
            Annuler
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={isPending || !fileToUpload}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Téléchargement...
              </>
            ) : (
              <>
                <UploadCloud className="mr-2 h-4 w-4" />
                Télécharger
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
