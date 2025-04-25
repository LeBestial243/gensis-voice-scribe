
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { FileType } from "@/hooks/use-file-operations";
import { getFileIcon } from "@/utils/file-utils";
import { Download, Loader2, Pencil, Trash2, MoreVertical } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface FileCardProps {
  file: FileType;
  onRename: (file: FileType) => void;
  onDelete: (fileId: string) => void;
  isDeleting: boolean;
}

export function FileCard({ file, onRename, onDelete, isDeleting }: FileCardProps) {
  const handleDownload = async () => {
    console.log('Downloading file:', file.name);
    try {
      const { data, error } = await supabase.storage
        .from('files')
        .download(file.path);
        
      if (error) {
        console.error('Error downloading file:', error);
        return;
      }
      
      // Create a URL for the file and trigger download
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error in download process:', error);
    }
  };
  
  return (
    <div className="group bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200">
      <div className="flex items-start space-x-4">
        {getFileIcon(file.type)}
        <div className="flex-1 min-w-0">
          <HoverCard>
            <HoverCardTrigger asChild>
              <h3 className="font-medium text-sm truncate">
                {file.name}
              </h3>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-1">
                <p className="text-sm font-medium">{file.name}</p>
              </div>
            </HoverCardContent>
          </HoverCard>
          <p className="text-xs text-muted-foreground mt-1">
            {file.created_at && format(new Date(file.created_at), 'PPp', { locale: fr })}
          </p>
        </div>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onRename(file)}
            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleDownload}
            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onDelete(file.id)}
            disabled={isDeleting}
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
