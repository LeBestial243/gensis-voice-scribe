
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TranscriptionPreviewDialogProps {
  file: {
    id: string;
    name: string;
    content?: string;
    path?: string;
    created_at: string;
    author?: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TranscriptionPreviewDialog({
  file,
  open,
  onOpenChange,
}: TranscriptionPreviewDialogProps) {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (file && open) {
      const fetchContent = async () => {
        setLoading(true);
        setFileContent(null);
        
        try {
          // First check if content is already available in the file object
          if (file.content) {
            setFileContent(file.content);
            return;
          }
          
          // If not, try to fetch from the database
          const { data, error } = await supabase
            .from('files')
            .select('content')
            .eq('id', file.id)
            .maybeSingle();
            
          if (error) {
            console.error('Error fetching file from database:', error);
          } else if (data?.content) {
            setFileContent(data.content);
            return;
          }
          
          // If still no content, try to download from storage
          if (file.path && typeof file.path === 'string') {
            try {
              const { data: fileData, error: downloadError } = await supabase.storage
                .from('files')
                .download(file.path);
                
              if (downloadError) {
                console.error('Error downloading from storage:', downloadError);
              } else if (fileData) {
                const text = await fileData.text();
                setFileContent(text);
                return;
              }
            } catch (downloadErr) {
              console.error('Exception during file download:', downloadErr);
            }
          }
          
          setFileContent("Impossible de charger le contenu du fichier.");
          
        } catch (error) {
          console.error('General error loading content:', error);
          setFileContent("Une erreur s'est produite lors du chargement du contenu.");
        } finally {
          setLoading(false);
        }
      };
      
      fetchContent();
    }
  }, [file, open]);

  if (!file) return null;

  const formatDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return format(date, "d MMMM yyyy 'à' HH:mm", { locale: fr });
    } catch (error) {
      return dateStr;
    }
  };
  
  const formattedDate = formatDate(file.created_at);
  
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (name || "FL").substring(0, 2).toUpperCase();
  };

  const authorName = file.author || "Felly Lunkeba";
  const authorInitials = getInitials(authorName);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 max-w-[60%]">
              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <DialogTitle className="text-xl font-semibold break-words">
                {file.name}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                  {authorInitials}
                </AvatarFallback>
              </Avatar>
              <span className="truncate max-w-[120px]">{authorName}</span>
              <span>•</span>
              <span>{formattedDate}</span>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 mt-6">
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !fileContent ? (
              <Card className="bg-muted/50">
                <CardContent className="pt-6 flex flex-col items-center justify-center text-center h-40">
                  <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Aucun contenu disponible</p>
                </CardContent>
              </Card>
            ) : (
              <div className="prose prose-gray max-w-none">
                <p className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {fileContent}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="pt-4 border-t flex justify-end items-center mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onOpenChange(false)}
          >
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
