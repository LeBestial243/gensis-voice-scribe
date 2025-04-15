
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
        <Label htmlFor="note-title">Titre de la note</Label>
        <input
          id="note-title"
          value={noteTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="generated-content">Contenu généré</Label>
        <Textarea
          id="generated-content"
          value={generatedContent}
          onChange={(e) => onContentChange(e.target.value)}
          className="min-h-[300px]"
        />
      </div>
    </div>
  );
}
