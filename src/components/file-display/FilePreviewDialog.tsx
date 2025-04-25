
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface FilePreviewDialogProps {
  file: {
    id: string;
    name: string;
    description?: string;
    content?: string;
    path?: string;
    created_at: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FilePreviewDialog({
  file,
  open,
  onOpenChange,
}: FilePreviewDialogProps) {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (file && open) {
      const fetchContent = async () => {
        // Réinitialiser l'état
        setLoading(true);
        setFileContent(null);
        
        try {
          console.log('Fetching file content for:', file);
          
          // D'abord vérifier si le contenu est déjà disponible dans le fichier
          if (file.content) {
            console.log('Using content from file object:', file.content.substring(0, 50) + '...');
            setFileContent(file.content);
            return;
          }
          
          // Ensuite vérifier le champ description
          if (file.description) {
            console.log('Using description from file object');
            setFileContent(file.description);
            return;
          }
          
          // Si pas de contenu disponible, essayer de récupérer depuis la base de données
          const { data, error } = await supabase
            .from('files')
            .select('content')
            .eq('id', file.id)
            .single();
            
          if (error) {
            console.error('Erreur lors de la récupération du fichier depuis la base de données:', error);
          } else if (data && data.content) {
            console.log('Retrieved content from database:', data.content.substring(0, 50) + '...');
            setFileContent(data.content);
            return;
          }
          
          // Si toujours pas de contenu, essayer de le récupérer depuis le storage
          if (file.path && typeof file.path === 'string') {
            try {
              console.log('Attempting to download from storage path:', file.path);
              const { data: fileData, error: downloadError } = await supabase.storage
                .from('files')
                .download(file.path);
                
              if (downloadError) {
                console.error('Erreur lors du téléchargement depuis le storage:', downloadError);
              } else if (fileData) {
                const text = await fileData.text();
                console.log('Downloaded content from storage:', text.substring(0, 50) + '...');
                setFileContent(text);
                return;
              }
            } catch (downloadErr) {
              console.error('Exception lors du téléchargement du fichier:', downloadErr);
            }
          }
          
          // Si on arrive ici, aucun contenu n'a été trouvé
          console.log('No content found by any method');
          setFileContent(null);
          
        } catch (error) {
          console.error('Erreur générale lors du chargement du contenu:', error);
          setFileContent(null);
        } finally {
          setLoading(false);
        }
      };
      
      fetchContent();
    }
  }, [file, open]);

  if (!file) return null;

  const createdAt = format(new Date(file.created_at), "PPP 'à' HH:mm", { locale: fr });
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-semibold">{file.name}</DialogTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                  {getInitials("Felly Lunkeba")}
                </AvatarFallback>
              </Avatar>
              <span>Felly Lunkeba</span>
              <span>•</span>
              <span>{createdAt}</span>
            </div>
          </div>
          <DialogDescription className="sr-only">
            Aperçu du fichier {file.name}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 mt-6">
          <div className="space-y-4">
            <div className="prose prose-gray max-w-none">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <p className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {fileContent || "Aucun contenu disponible"}
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
