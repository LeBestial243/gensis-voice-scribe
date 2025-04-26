
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock, Edit, Download, Trash2, Eye } from "lucide-react";
import { TranscriptionPreviewDialog } from "./TranscriptionPreviewDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface TranscriptionsListProps {
  profileId: string;
  searchQuery?: string;
  folderIds?: string[];
}

export function TranscriptionsList({ profileId, searchQuery = "", folderIds = [] }: TranscriptionsListProps) {
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: transcriptions = [], isLoading } = useQuery({
    queryKey: ['transcriptions', profileId, folderIds, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('files')
        .select('*')
        .eq('type', 'transcription');
      
      if (folderIds.length > 0) {
        query = query.in('folder_id', folderIds);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Filter by search query if provided
      const filtered = searchQuery
        ? data.filter(file => 
            file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (file.content && file.content.toLowerCase().includes(searchQuery.toLowerCase()))
          )
        : data;
        
      return filtered;
    },
  });

  const handleViewTranscription = (transcription: any) => {
    setSelectedFile(transcription);
    setPreviewOpen(true);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    try {
      return format(parseISO(dateStr), "d MMMM yyyy", { locale: fr });
    } catch (error) {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Vos transcriptions</h2>
        <Card className="bg-muted/50">
          <CardContent className="pt-6 flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Vos transcriptions</h2>
      
      {transcriptions.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center h-40">
            <FileText className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Aucune transcription disponible</p>
            <p className="text-sm text-muted-foreground">Enregistrez votre voix pour créer votre première transcription</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {transcriptions.map((transcription) => {
            const previewText = transcription.content 
              ? (transcription.content.length > 150 
                ? transcription.content.substring(0, 150) + "..." 
                : transcription.content)
              : "Contenu non disponible";
              
            return (
              <Card key={transcription.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{transcription.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(transcription.created_at)}</span>
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm line-clamp-2">{previewText}</p>
                </CardContent>
                <CardFooter className="border-t bg-muted/30 py-2 px-6">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-medium">
                      <span className="text-green-600 dark:text-green-400">
                        Document complet
                      </span>
                    </span>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="text-xs h-auto p-0 flex items-center gap-1"
                      onClick={() => handleViewTranscription(transcription)}
                    >
                      <Eye className="h-3 w-3" />
                      Voir le document
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
      
      <TranscriptionPreviewDialog 
        file={selectedFile}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
