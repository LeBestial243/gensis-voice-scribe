
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Structure {
  id: string;
  name: string;
}

interface StructureSelectorProps {
  structures: Structure[];
  selectedStructureId: string | null;
  setSelectedStructureId: (structureId: string) => void;
}

export function StructureSelector({
  structures,
  selectedStructureId,
  setSelectedStructureId
}: StructureSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="structure-selector">Structure</Label>
      <Select 
        value={selectedStructureId || ""} 
        onValueChange={setSelectedStructureId}
      >
        <SelectTrigger id="structure-selector" className="max-w-md">
          <SelectValue placeholder="Sélectionner une structure" />
        </SelectTrigger>
        <SelectContent>
          {structures.map((structure) => (
            <SelectItem key={structure.id} value={structure.id}>
              {structure.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">
        La structure à laquelle ce template sera associé
      </p>
    </div>
  );
}
