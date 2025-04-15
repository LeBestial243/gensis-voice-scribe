
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface FileSelectorProps {
  profileId: string;
  selectedFiles: string[];
  onFileSelect: (fileId: string) => void;
}

export function FileSelector({ profileId, selectedFiles, onFileSelect }: FileSelectorProps) {
  const { data: files = [] } = useQuery({
    queryKey: ['files_for_generation', profileId],
    queryFn: async () => {
      // First fetch folders
      const { data: folders } = await supabase
        .from('folders')
        .select('id')
        .eq('profile_id', profileId);
      
      if (!folders) return [];
      
      // Then fetch files and their contents
      const { data: filesData, error } = await supabase
        .from('files')
        .select(`
          id,
          name,
          type,
          created_at,
          updated_at,
          content
        `)
        .in('folder_id', folders.map(f => f.id))
        .eq('type', 'text/plain')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return filesData;
    },
  });

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

