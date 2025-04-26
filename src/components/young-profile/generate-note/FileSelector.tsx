
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, Eye, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TranscriptionPreviewDialog } from "@/components/TranscriptionPreviewDialog";

// Define a custom File interface that includes content
export interface FileWithContent {
  id: string;
  name: string;
  type: string;
  created_at: string;
  updated_at: string;
  path: string;
  content?: string;
  size?: number;
}

interface FileSelectorProps {
  profileId: string;
  selectedFiles: string[];
  onFileSelect: (fileId: string) => void;
}

export function FileSelector({ profileId, selectedFiles, onFileSelect }: FileSelectorProps) {
  const [previewFile, setPreviewFile] = useState<FileWithContent | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['files_for_generation', profileId],
    queryFn: async () => {
      try {
        // First fetch folders
        const { data: folders, error: foldersError } = await supabase
          .from('folders')
          .select('id')
          .eq('profile_id', profileId);
        
        if (foldersError) {
          console.error('Error fetching folders:', foldersError);
          throw foldersError;
        }
        
        if (!folders || folders.length === 0) return [];
        
        // Then fetch files
        const { data: filesData, error: filesError } = await supabase
          .from('files')
          .select(`
            id,
            name,
            type,
            created_at,
            updated_at,
            path,
            content,
            size
          `)
          .in('folder_id', folders.map(f => f.id))
          .in('type', ['text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
          .order('created_at', { ascending: false });
        
        if (filesError) {
          console.error('Error fetching files:', filesError);
          throw filesError;
        }
        
        return filesData || [];
      } catch (error) {
        console.error('Error in files query:', error);
        return [];
      }
    },
  });

  const handlePreview = (file: FileWithContent) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return format(date, "d MMM yyyy", { locale: fr });
    } catch (error) {
      return dateStr;
    }
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const getFileIcon = (filename: string) => {
    const extension = getFileExtension(filename);
    if (extension === 'txt') {
      return <FileText className="h-8 w-8 text-blue-500" />;
    } else if (extension === 'docx') {
      return <FileText className="h-8 w-8 text-indigo-500" />;
    }
    return <FileText className="h-8 w-8 text-gray-500" />;
  };

  if (isLoading) {
    return <div className="flex justify-center p-4">Chargement des fichiers...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Documents disponibles</h3>
      <p className="text-sm text-muted-foreground">
        Sélectionnez les documents à utiliser pour générer la note
      </p>

      <ScrollArea className="h-[400px] rounded-md border p-4">
        <div className="space-y-4">
          {files.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Aucun fichier texte disponible
            </p>
          ) : (
            files.map((file) => (
              <div key={file.id} className="group rounded-xl border bg-card shadow-sm hover:shadow transition-all duration-200">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={file.id}
                        checked={selectedFiles.includes(file.id)}
                        onCheckedChange={() => onFileSelect(file.id)}
                        className="mt-1"
                      />
                      <div>
                        <Label
                          htmlFor={file.id}
                          className="font-medium text-base peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {getFileIcon(file.name)}
                            <span>{file.name}</span>
                          </div>
                        </Label>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <span>{formatDate(file.created_at)}</span>
                          <span className="mx-2">•</span>
                          <span>{Math.round((file.size || 0) / 1024)} Ko</span>
                        </div>
                        {file.content && (
                          <div className="mt-2 text-sm text-muted-foreground line-clamp-1">
                            {file.content}
                          </div>
                        )}
                      </div>
                    </div>

                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handlePreview(file)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {selectedFiles.length} fichier(s) sélectionné(s)
        </div>
      </div>

      <TranscriptionPreviewDialog
        file={previewFile}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
