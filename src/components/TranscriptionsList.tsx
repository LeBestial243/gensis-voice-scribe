
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranscriptions } from "@/hooks/useTranscriptions";
import { TranscriptionCard } from "./young-profile/transcriptions/TranscriptionCard";
import { CustomPagination } from "./CustomPagination";
import type { FileData } from "@/types/files";

interface TranscriptionsListProps {
  profileId: string;
  folderId?: string | null;
  searchQuery?: string;
  folderIds?: string[];
}

const PAGE_SIZE = 5; // Number of transcriptions per page

export function TranscriptionsList({ 
  profileId, 
  folderId, 
  searchQuery = "", 
  folderIds = [] 
}: TranscriptionsListProps) {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  
  // Get folder IDs to filter by
  const filterFolderIds = folderId ? [folderId] : folderIds;
  
  const { files, isLoading, totalCount } = useTranscriptions(
    profileId, 
    folderId, 
    searchQuery, 
    {
      page: currentPage,
      pageSize: PAGE_SIZE
    }
  );

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

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
      const { data, error } = await supabase.storage
        .from('files')
        .createSignedUrl(file.path, 60);
        
      if (error || !data?.signedUrl) throw error;
      
      const a = document.createElement('a');
      a.href = data.signedUrl;
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
    }
  };

  if (filterFolderIds.length === 0) {
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
      <div className="flex justify-center items-center p-8">
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
    <div>
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
      
      <CustomPagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
