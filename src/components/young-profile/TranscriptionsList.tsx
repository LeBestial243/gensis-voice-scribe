
import { CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranscriptions } from "@/hooks/useTranscriptions";
import { TranscriptionCard } from "./transcriptions/TranscriptionCard";
import { fileService } from "@/services/fileService";
import { MorphCard } from "@/components/ui/MorphCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FileData } from "@/types/files";

interface TranscriptionsListProps {
  profileId: string;
  folderId: string | null;
  searchQuery: string;
}

export function TranscriptionsList({ profileId, folderId, searchQuery }: TranscriptionsListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { 
    data: { files, folderIds },
    status: { isLoading }
  } = useTranscriptions(profileId, folderId, searchQuery);
  
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: fileService.deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transcriptions'] });
      toast({
        title: "Fichier supprimé",
        description: "Le fichier a été supprimé avec succès."
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le fichier.",
        variant: "destructive"
      });
      console.error('Error deleting file:', error);
    }
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleDownload = async (file: FileData) => {
    try {
      setIsDownloading(file.id);
      const signedUrl = await fileService.downloadFile(file);
      
      const a = document.createElement('a');
      a.href = signedUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Fichier téléchargé",
        description: "Le fichier a été téléchargé avec succès."
      });
    } catch (error) {
      toast({
        title: "Erreur de téléchargement",
        description: "Une erreur s'est produite lors du téléchargement",
        variant: "destructive",
      });
      console.error('Error downloading file:', error);
    } finally {
      setIsDownloading(null);
    }
  };

  if (folderIds.length === 0) {
    return (
      <MorphCard className="bg-muted/50">
        <CardContent className="pt-6 flex flex-col items-center justify-center text-center h-40">
          <FileText className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Aucun dossier trouvé</p>
          <p className="text-sm text-muted-foreground">Créez d'abord un dossier pour y ajouter des fichiers</p>
        </CardContent>
      </MorphCard>
    );
  }

  if (isLoading) {
    return (
      <MorphCard className="bg-muted/50">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <LoadingSpinner size="md" />
          <p className="mt-4 text-muted-foreground">Chargement des transcriptions...</p>
        </CardContent>
      </MorphCard>
    );
  }

  if (files.length === 0) {
    return (
      <MorphCard className="bg-muted/50">
        <CardContent className="pt-6 flex flex-col items-center justify-center text-center h-40">
          <FileText className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Aucun fichier trouvé</p>
          {searchQuery && (
            <p className="text-sm text-muted-foreground">Aucun résultat pour "{searchQuery}"</p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            Utilisez le bouton d'enregistrement pour créer votre première transcription
          </p>
        </CardContent>
      </MorphCard>
    );
  }

  return (
    <ScrollArea className="max-h-[600px]">
      <div className="space-y-3">
        {files.map((file) => (
          <TranscriptionCard
            key={file.id}
            file={file}
            onDelete={handleDelete}
            onDownload={handleDownload}
            isDownloading={isDownloading === file.id}
            isDeleting={deleteMutation.isPending}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
