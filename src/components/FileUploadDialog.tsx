
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type FileUploadDialogProps = {
  folderId: string;
};

export function FileUploadDialog({ folderId }: FileUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      console.log('Uploading file to folder:', folderId);
      
      // Create the storage folder if it doesn't exist
      try {
        // Upload file to storage
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${folderId}/${fileName}`;
        
        console.log('Uploading to path:', filePath);
        const { data: storageData, error: storageError } = await supabase.storage
          .from('files')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (storageError) {
          console.error('Storage error:', storageError);
          throw storageError;
        }

        console.log('File uploaded successfully:', storageData);

        // Create file record in database
        const { data: fileData, error: dbError } = await supabase
          .from('files')
          .insert({
            folder_id: folderId,
            name: file.name,
            type: file.type,
            size: file.size,
            path: storageData.path,
          })
          .select()
          .single();

        if (dbError) {
          console.error('Database error:', dbError);
          throw dbError;
        }

        console.log('File record created:', fileData);
        return fileData;
      } catch (error) {
        console.error('Upload process error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('Upload successful, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['files', folderId] });
      setOpen(false);
      setSelectedFile(null);
      toast({ title: "Fichier ajouté avec succès" });
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast({
        title: "Erreur lors de l'ajout du fichier",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      uploadFile.mutate(selectedFile);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Upload className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un fichier</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="file"
            onChange={handleFileChange}
            disabled={uploadFile.isPending}
            className="w-full"
          />
          {selectedFile && (
            <p className="text-sm text-muted-foreground">
              {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </p>
          )}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={!selectedFile || uploadFile.isPending}
            >
              {uploadFile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Téléchargement...
                </>
              ) : (
                "Télécharger"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
