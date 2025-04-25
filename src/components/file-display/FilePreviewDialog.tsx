
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface FilePreviewDialogProps {
  file: {
    id: string;
    name: string;
    description?: string;
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
          <h2 className="text-2xl font-semibold mb-6">{file.name}</h2>
        </DialogHeader>
        
        <ScrollArea className="flex-1">
          <div className="space-y-6">
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-muted-foreground">État</span>
              <Badge variant="secondary" className="bg-red-50 text-red-600 hover:bg-red-50">
                Not started
              </Badge>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-muted-foreground">Assignation</span>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                    {getInitials("Felly Lunkeba")}
                  </AvatarFallback>
                </Avatar>
                <span>Felly Lunkeba</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-muted-foreground">Level</span>
              <Badge variant="secondary" className="bg-red-50 text-red-600 hover:bg-red-50">
                high
              </Badge>
            </div>

            {file.description && (
              <div className="py-3 border-b">
                <h3 className="text-lg font-medium mb-2">Commentaires</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{file.description}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
