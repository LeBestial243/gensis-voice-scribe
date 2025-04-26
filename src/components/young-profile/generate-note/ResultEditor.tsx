
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Download, Save } from "lucide-react";

interface ResultEditorProps {
  noteTitle: string;
  onTitleChange: (title: string) => void;
  generatedContent: string;
  onContentChange: (content: string) => void;
}

export function ResultEditor({
  noteTitle,
  onTitleChange,
  generatedContent,
  onContentChange,
}: ResultEditorProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="note-title" className="text-base font-medium">Titre de la note</Label>
        <input
          id="note-title"
          value={noteTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-base shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Entrez un titre pour la note"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="generated-content" className="text-base font-medium">Contenu de la note</Label>
        <div className="relative">
          <Textarea
            id="generated-content"
            value={generatedContent}
            onChange={(e) => onContentChange(e.target.value)}
            className="min-h-[400px] text-base p-4 rounded-lg"
            placeholder="Le contenu généré apparaîtra ici. Vous pourrez le modifier avant de sauvegarder."
          />
        </div>
      </div>
    </div>
  );
}
