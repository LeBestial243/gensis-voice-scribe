
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TemplateHeaderProps {
  templateTitle: string;
  setTemplateTitle: (title: string) => void;
}

export function TemplateHeader({ templateTitle, setTemplateTitle }: TemplateHeaderProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="template-title">Titre du template</Label>
      <Input
        id="template-title"
        value={templateTitle}
        onChange={(e) => setTemplateTitle(e.target.value)}
        placeholder="Ex: Rapport d'entretien individuel"
        className="max-w-md"
      />
    </div>
  );
}
