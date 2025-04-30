
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2 } from "lucide-react";

interface Section {
  id: string;
  title: string;
  instructions: string;
}

interface SectionItemProps {
  section: Section;
  index: number;
  onRemove: () => void;
  onTitleChange: (value: string) => void;
  onInstructionsChange: (value: string) => void;
  dragHandleProps: any;
}

export function SectionItem({
  section,
  index,
  onRemove,
  onTitleChange,
  onInstructionsChange,
  dragHandleProps
}: SectionItemProps) {
  return (
    <div className="border rounded-md p-4 bg-card">
      <div className="flex items-start justify-between mb-2">
        <div className="font-medium">Section {index + 1}</div>
        <div className="flex items-center gap-2">
          <div {...dragHandleProps} className="cursor-grab">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-8 w-8 p-0 text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Supprimer</span>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`section-${index}-title`}>Titre de la section</Label>
          <Input
            id={`section-${index}-title`}
            value={section.title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Ex: Contexte de l'entretien"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`section-${index}-instructions`}>
            Instructions pour l'IA (optionnel)
          </Label>
          <Textarea
            id={`section-${index}-instructions`}
            value={section.instructions}
            onChange={(e) => onInstructionsChange(e.target.value)}
            placeholder="Ex: Résumer le contexte de l'échange en 3-4 phrases, mentionner le lieu et l'ambiance"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}
