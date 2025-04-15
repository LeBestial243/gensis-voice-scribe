
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type FileUploadDialogProps = {
  folderId: string;
};

export function FileUploadDialog({ folderId }: FileUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      // Upload file to storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('files')
        .upload(`${folderId}/${file.name}`, file);

      if (storageError) throw storageError;

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

      if (dbError) throw dbError;
      return fileData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', folderId] });
      setOpen(false);
      toast({ title: "Fichier ajouté avec succès" });
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast({
        title: "Erreur lors de l'ajout du fichier",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile.mutate(file);
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
        <div className="space-y-4">
          <input
            type="file"
            onChange={handleFileChange}
            disabled={uploadFile.isPending}
            className="w-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
