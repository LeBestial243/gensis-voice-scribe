
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{file.name}</DialogTitle>
          <p className="text-sm text-muted-foreground">{createdAt}</p>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            <p className="whitespace-pre-wrap">{file.description || "Aucun contenu disponible"}</p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
