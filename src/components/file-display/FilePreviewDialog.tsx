
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
          // D'abord vérifier si le contenu est déjà disponible
          if (file.content) {
            setFileContent(file.content);
            return;
          }
          
          // Ensuite vérifier le champ description
          if (file.description) {
            setFileContent(file.description);
            return;
          }
          
          // Si aucun contenu n'est disponible directement, essayer de récupérer depuis la base de données
          const { data, error } = await supabase
            .from('files')
            .select('content, description')
            .eq('id', file.id)
            .single();
            
          if (error) throw error;
          
          if (data) {
            const content = data.content || data.description;
            setFileContent(content || null);
          }
        } catch (error) {
          console.error('Erreur lors du chargement du contenu:', error);
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
