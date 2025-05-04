
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";
import { useState } from "react";
import { NoteType, NOTE_TYPES } from "@/types/note-generation";
import { DatePicker } from "@/components/ui/date-picker";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface ResultEditorProps {
  noteTitle: string;
  onTitleChange: (title: string) => void;
  generatedContent: string;
  onContentChange: (content: string) => void;
  noteType?: NoteType;
  onNoteTypeChange?: (type: NoteType) => void;
  periodStart?: Date;
  onPeriodStartChange?: (date: Date | undefined) => void;
  periodEnd?: Date;
  onPeriodEndChange?: (date: Date | undefined) => void;
  onSave?: () => void;
}

export function ResultEditor({
  noteTitle,
  onTitleChange,
  generatedContent,
  onContentChange,
  noteType = 'general',
  onNoteTypeChange,
  periodStart,
  onPeriodStartChange,
  periodEnd,
  onPeriodEndChange,
  onSave
}: ResultEditorProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!noteTitle.trim() || !generatedContent.trim()) {
      return;
    }
    
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave();
      }
      setIsSaving(false);
    } catch (error) {
      setIsSaving(false);
      console.error("Error saving note:", error);
    }
  };

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

      {onNoteTypeChange && (
        <div>
          <Label htmlFor="editor-note-type">Type de note</Label>
          <Select 
            value={noteType} 
            onValueChange={(value) => onNoteTypeChange(value as NoteType)}
          >
            <SelectTrigger id="editor-note-type" className="w-full mt-1">
              <SelectValue placeholder="Sélectionner un type" />
            </SelectTrigger>
            <SelectContent>
              {NOTE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {onPeriodStartChange && onPeriodEndChange && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="editor-period-start">Date de début</Label>
            <DatePicker
              id="editor-period-start"
              date={periodStart}
              setDate={onPeriodStartChange}
              placeholder="Date de début"
            />
          </div>
          <div>
            <Label htmlFor="editor-period-end">Date de fin</Label>
            <DatePicker
              id="editor-period-end"
              date={periodEnd}
              setDate={onPeriodEndChange}
              placeholder="Date de fin"
            />
          </div>
        </div>
      )}

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

      <div className="flex justify-end">
        <Button 
          type="button"
          onClick={handleSave}
          disabled={isSaving}
        >
          <Save className="mr-2 h-4 w-4" />
          Sauvegarder
        </Button>
      </div>
    </div>
  );
}
