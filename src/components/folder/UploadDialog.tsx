
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, UploadCloud } from "lucide-react";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File) => void;
  isUploading: boolean;
}

export function UploadDialog({
  open,
  onOpenChange,
  onUpload,
  isUploading,
}: UploadDialogProps) {
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button 
            type="button" 
            onClick={() => fileToUpload && onUpload(fileToUpload)}
            disabled={isUploading || !fileToUpload}
          >
            {isUploading ? (
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
