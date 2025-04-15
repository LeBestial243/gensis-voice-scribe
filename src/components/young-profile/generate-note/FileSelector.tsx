
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface File {
  id: string;
  name: string;
  type: string;
  created_at: string;
  updated_at: string;
  path: string;
  content?: string;
}

interface FileSelectorProps {
  profileId: string;
  selectedFiles: string[];
  onFileSelect: (fileId: string) => void;
}

export function FileSelector({ profileId, selectedFiles, onFileSelect }: FileSelectorProps) {
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
            path
          `)
          .in('folder_id', folders.map(f => f.id))
          .eq('type', 'text/plain')
          .order('created_at', { ascending: false });
        
        if (filesError) {
          console.error('Error fetching files:', filesError);
          throw filesError;
        }
        
        if (!filesData) return [];

        // For each file, try to get its content
        const filesWithContent: File[] = [];
        
        for (const file of filesData) {
          try {
            // Attempt to download the file content
            const { data: fileContent, error: downloadError } = await supabase
              .storage
              .from('files')
              .download(file.path);
            
            if (downloadError) {
              console.error('Error downloading file:', downloadError);
              filesWithContent.push({ ...file, content: '' });
              continue;
            }

            // Convert blob to text
            const content = await fileContent.text();
            filesWithContent.push({ ...file, content });
          } catch (error) {
            console.error('Error processing file content:', error);
            filesWithContent.push({ ...file, content: '' });
          }
        }
        
        return filesWithContent;
      } catch (error) {
        console.error('Error in files query:', error);
        return [];
      }
    },
  });

  if (isLoading) {
    return <div className="flex justify-center p-4">Chargement des fichiers...</div>;
  }

  return (
    <ScrollArea className="h-[400px] rounded-md border p-4">
      <div className="space-y-4">
        {files.length === 0 ? (
          <p className="text-center text-muted-foreground">
            Aucun fichier disponible
          </p>
        ) : (
          files.map((file) => (
            <div key={file.id} className="flex items-start space-x-3">
              <Checkbox
                id={file.id}
                checked={selectedFiles.includes(file.id)}
                onCheckedChange={() => onFileSelect(file.id)}
              />
              <Label
                htmlFor={file.id}
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                <div className="font-medium mb-1">{file.name}</div>
                <div className="text-muted-foreground text-xs">
                  {format(new Date(file.created_at), "PPP", { locale: fr })}
                </div>
                {file.content && (
                  <div className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {file.content}
                  </div>
                )}
              </Label>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
}
