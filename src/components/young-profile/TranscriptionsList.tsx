
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranscriptions } from "@/hooks/useTranscriptions";
import { TranscriptionCard } from "./transcriptions/TranscriptionCard";
import type { FileData } from "@/types/files";

interface TranscriptionsListProps {
  profileId: string;
  folderId: string | null;
  searchQuery: string;
}

export function TranscriptionsList({ profileId, folderId, searchQuery }: TranscriptionsListProps) {
  const { toast } = useToast();
  const { files, isLoading, folderIds } = useTranscriptions(profileId, folderId, searchQuery);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Fichier supprimé",
        description: "Le fichier a été supprimé avec succès."
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le fichier.",
        variant: "destructive"
      });
    }
  };

  const handleDownload = async (file: FileData) => {
    try {
      const { error } = await supabase.storage
        .from('files')
        .download(file.path);
      
      if (error) throw error;
      
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
    }
  };

  if (folderIds.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="pt-6 flex flex-col items-center justify-center text-center h-40">
          <FileText className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Aucun dossier trouvé</p>
          <p className="text-sm text-muted-foreground">Créez d'abord un dossier pour y ajouter des fichiers</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <Card className="bg-muted/50">
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
      </Card>
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
          />
        ))}
      </div>
    </ScrollArea>
  );
}
