
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, FileAudio, MoreVertical, Play, Edit, Trash, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface TranscriptionsListProps {
  profileId: string;
  folderId: string | null;
  searchQuery: string;
}

export function TranscriptionsList({ profileId, folderId, searchQuery }: TranscriptionsListProps) {
  const { toast } = useToast();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Fetch folders for the profile
  const { data: folders = [] } = useQuery({
    queryKey: ['folders', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('id')
        .eq('profile_id', profileId);

      if (error) throw error;
      return data;
    },
  });

  // Get folder IDs
  const folderIds = folders.map(folder => folder.id);

  // Fetch files based on folders
  const { data: files = [], isLoading } = useQuery({
    queryKey: ['files', profileId, folderId, folderIds],
    queryFn: async () => {
      let query = supabase
        .from('files')
        .select('*');
      
      // Filter by specific folder or all folders related to the profile
      if (folderId) {
        query = query.eq('folder_id', folderId);
      } else if (folderIds.length > 0) {
        query = query.in('folder_id', folderIds);
      } else {
        return [];
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: folderIds.length > 0 || !!folderId,
  });

  // Filter files based on search query
  const filteredFiles = files.filter(file => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return file.name.toLowerCase().includes(searchLower);
  });

  const toggleExpand = (id: string) => {
    setExpandedItem(expandedItem === id ? null : id);
  };

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

  const getFileIcon = (type: string) => {
    if (type.includes('audio')) {
      return <FileAudio className="h-5 w-5 text-blue-500" />;
    }
    return <FileText className="h-5 w-5 text-emerald-500" />;
  };

  const getFileTypeLabel = (type: string) => {
    if (type.includes('audio')) {
      return 'Audio';
    }
    if (type.includes('transcription')) {
      return 'Transcription';
    }
    return 'Document';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (filteredFiles.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="pt-6 flex flex-col items-center justify-center text-center h-40">
          <FileText className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Aucun fichier trouvé</p>
          {searchQuery && (
            <p className="text-sm text-muted-foreground">Aucun résultat pour "{searchQuery}"</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="max-h-[600px]">
      <div className="space-y-3 pr-4">
        {filteredFiles.map((file) => (
          <Card key={file.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-2">
                  {getFileIcon(file.type)}
                  <div>
                    <CardTitle className="text-base">{file.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <span>
                        {file.created_at && formatDistanceToNow(parseISO(file.created_at), { 
                          addSuffix: true, 
                          locale: fr 
                        })}
                      </span>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="outline">
                    {getFileTypeLabel(file.type)}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {file.type.includes('audio') && (
                        <DropdownMenuItem>
                          <Play className="h-4 w-4 mr-2" />
                          Écouter
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Éditer
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDelete(file.id)}
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className={`text-sm ${expandedItem === file.id ? '' : 'line-clamp-2'}`}>
                {file.content || "Aucun contenu disponible"}
              </p>
              {file.content && (
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-xs h-auto p-0 mt-1"
                  onClick={() => toggleExpand(file.id)}
                >
                  {expandedItem === file.id ? "Voir moins" : "Voir plus"}
                </Button>
              )}
            </CardContent>
            <CardFooter className="border-t bg-muted/30 py-2 px-6">
              <div className="flex items-center gap-2">
                {file.type.includes('audio') && (
                  <Button size="sm" variant="secondary" className="h-8">
                    <Play className="h-3 w-3 mr-1" />
                    Écouter
                  </Button>
                )}
                <Button size="sm" variant="outline" className="h-8">
                  <Edit className="h-3 w-3 mr-1" />
                  Éditer
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
