
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Structure {
  id: string;
  name: string;
}

interface StructureSelectorProps {
  structures: Structure[];
  selectedStructureId: string | null;
  setSelectedStructureId: (id: string) => void;
}

export function StructureSelector({ 
  structures, 
  selectedStructureId, 
  setSelectedStructureId 
}: StructureSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="structure">Structure</Label>
      <Select
        value={selectedStructureId || ""}
        onValueChange={setSelectedStructureId}
      >
        <SelectTrigger id="structure" className="max-w-md">
          <SelectValue placeholder="Sélectionnez une structure" />
        </SelectTrigger>
        <SelectContent>
          {structures.map(structure => (
            <SelectItem key={structure.id} value={structure.id}>
              {structure.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
