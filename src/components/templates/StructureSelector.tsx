
import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Structure {
  id: string;
  name: string;
}

interface StructureSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
  includeAllOption?: boolean;
}

export function StructureSelector({
  value,
  onChange,
  includeAllOption = false,
}: StructureSelectorProps) {
  const [structures, setStructures] = useState<Structure[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchStructures = async () => {
      setIsLoading(true);
      try {
        // Mock implementation since the structures table doesn't exist in Supabase types
        // In a real implementation, you would fetch this from an API or Supabase
        setStructures([
          { id: '1', name: 'Centre A' },
          { id: '2', name: 'Centre B' },
          { id: '3', name: 'Centre C' },
        ]);
      } catch (error) {
        console.error('Error fetching structures:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStructures();
  }, []);

  return (
    <Select
      value={value || ''}
      onValueChange={(val) => onChange(val === 'all' ? null : val)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Sélectionner une structure" />
      </SelectTrigger>
      <SelectContent>
        {includeAllOption && (
          <SelectItem value="all">Toutes les structures</SelectItem>
        )}
        {structures.map((structure) => (
          <SelectItem key={structure.id} value={structure.id}>
            {structure.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
