
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "lucide-react";
import { ProjectObjective, ObjectiveStatus } from "@/types/casf";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ObjectiveFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<ProjectObjective, 'id' | 'created_at'>) => void;
  projectId: string;
  initialData?: Partial<ProjectObjective>;
}

export function ObjectiveFormDialog({
  isOpen,
  onClose,
  onSubmit,
  projectId,
  initialData
}: ObjectiveFormDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const today = new Date();
  const formattedToday = today.toISOString().split('T')[0];
  
  const [formData, setFormData] = useState<Partial<ProjectObjective>>({
    title: '',
    description: '',
    status: 'pending' as ObjectiveStatus,
    target_date: formattedToday,
    progress: 0,
    project_id: projectId
  });

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        target_date: initialData.target_date ? new Date(initialData.target_date).toISOString().split('T')[0] : formattedToday,
        project_id: projectId
      });
    } else {
      // Reset form data when no initialData is provided
      setFormData({
        title: '',
        description: '',
        status: 'pending' as ObjectiveStatus,
        target_date: formattedToday,
        progress: 0,
        project_id: projectId
      });
    }
  }, [initialData, projectId, formattedToday]);

  const handleChange = (field: keyof ProjectObjective, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      toast({
        title: "Titre manquant",
        description: "Veuillez saisir un titre pour l'objectif",
        variant: "destructive"
      });
      return;
    }

    if (!formData.target_date) {
      toast({
        title: "Date cible manquante",
        description: "Veuillez sélectionner une date cible",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Format the target_date as ISO string
      const formattedData = {
        ...formData,
        target_date: new Date(formData.target_date as string).toISOString(),
        project_id: projectId
      };
      
      await onSubmit(formattedData as Omit<ProjectObjective, 'id' | 'created_at'>);
      
      toast({
        title: initialData ? "Objectif mis à jour" : "Objectif créé",
        description: initialData 
          ? "L'objectif a été mis à jour avec succès"
          : "L'objectif a été créé avec succès",
      });
      
      onClose();
    } catch (error) {
      console.error('Error submitting objective:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement de l'objectif",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Modifier l'objectif" : "Ajouter un nouvel objectif"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="title">Titre de l'objectif</Label>
            <Input
              id="title"
              value={formData.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Ex: Renforcer les compétences sociales"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Décrivez l'objectif spécifique..."
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select 
                value={formData.status as string} 
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">À faire</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="achieved">Atteint</SelectItem>
                  <SelectItem value="canceled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="target_date">Date cible</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="target_date"
                  type="date"
                  className="pl-9"
                  value={formData.target_date?.toString() || ''}
                  onChange={(e) => handleChange('target_date', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="progress">Progression (%)</Label>
            <Input
              id="progress"
              type="number"
              min={0}
              max={100}
              value={formData.progress || 0}
              onChange={(e) => handleChange('progress', parseInt(e.target.value))}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Enregistrement..." : initialData ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
