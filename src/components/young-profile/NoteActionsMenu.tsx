import { MoreHorizontal, Copy, FileText, File, Mail } from "lucide-react";
import { useState } from "react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { jsPDF } from "jspdf";

interface Note {
  id: string;
  title: string;
  content: string;
  user_id: string;
}

interface NoteActionsMenuProps {
  note: Note;
}

export function NoteActionsMenu({ note }: NoteActionsMenuProps) {
  const { toast } = useToast();
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(note.content);
      toast({
        title: "Note copiée !",
        description: "Le contenu a été copié dans le presse-papier."
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le contenu.",
        variant: "destructive"
      });
    }
  };

  const handleExportTxt = () => {
    try {
      const blob = new Blob([note.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Note - ${note.title}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Note exportée !",
        description: "Le fichier .txt a été téléchargé."
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible d'exporter la note.",
        variant: "destructive"
      });
    }
  };

  const handleExportPdf = () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text(note.title, 20, 20);
      
      // Add content with word wrap
      doc.setFontSize(12);
      const splitText = doc.splitTextToSize(note.content, 170);
      doc.text(splitText, 20, 40);
      
      // Save the PDF
      doc.save(`Note - ${note.title}.pdf`);

      toast({
        title: "Note exportée !",
        description: "Le fichier .pdf a été téléchargé."
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF.",
        variant: "destructive"
      });
    }
  };

  const handleSendEmail = async () => {
    setIsSending(true);
    
    try {
      const response = await fetch("/api/send-note", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailAddress,
          noteTitle: note.title,
          noteContent: note.content
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de l'envoi");

      toast({
        title: "Email envoyé !",
        description: "La note a été envoyée à l'adresse indiquée."
      });
      setIsEmailDialogOpen(false);
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'email.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <span className="sr-only">Ouvrir le menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" />
            Copier
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportTxt}>
            <FileText className="mr-2 h-4 w-4" />
            Exporter en .txt
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportPdf}>
            <File className="mr-2 h-4 w-4" />
            Exporter en PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsEmailDialogOpen(true)}>
            <Mail className="mr-2 h-4 w-4" />
            Envoyer par email
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer la note par email</DialogTitle>
            <DialogDescription>
              La note sera envoyée au format texte à l'adresse email indiquée.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                placeholder="exemple@domaine.com"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsEmailDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={!emailAddress || isSending}
              >
                {isSending ? "Envoi en cours..." : "Envoyer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
