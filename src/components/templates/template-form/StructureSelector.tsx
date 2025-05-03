
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';

interface Structure {
  id: string;
  name: string;
}

interface StructureSelectorProps {
  selectedStructureId: string | null;
  onStructureChange: (structureId: string | null) => void;
}

export function StructureSelector({ selectedStructureId, onStructureChange }: StructureSelectorProps) {
  // Fetch available structures
  const { data: structures = [] } = useQuery({
    queryKey: ['structures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('structures')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data as Structure[];
    },
  });
  
  const handleStructureChange = (value: string) => {
    onStructureChange(value === 'none' ? null : value);
  };
  
  return (
    <div className="space-y-2">
      <Label htmlFor="structure-selector">Structure (optionnelle)</Label>
      <Select 
        value={selectedStructureId || 'none'} 
        onValueChange={handleStructureChange}
      >
        <SelectTrigger id="structure-selector">
          <SelectValue placeholder="Sélectionner une structure" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Aucune structure</SelectItem>
          {structures.map((structure) => (
            <SelectItem key={structure.id} value={structure.id}>
              {structure.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">
        Associer un template à une structure permet de le partager avec les membres de cette structure.
      </p>
    </div>
  );
}
