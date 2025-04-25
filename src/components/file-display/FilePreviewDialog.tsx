
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">{file.name}</h2>
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
              <p className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">
                {file.description || "Aucun contenu disponible"}
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
