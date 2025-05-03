
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building, Edit, Trash2, Plus, Users } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";

interface Structure {
  id: string;
  name: string;
  description: string | null;
}

interface StructuresManagementProps {
  onManageUsers: (structureId: string, structureName: string) => void;
}

export function StructuresManagement({ onManageUsers }: StructuresManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteStructureId, setDeleteStructureId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState<Structure | null>(null);
  const [newStructure, setNewStructure] = useState<{name: string, description: string}>({
    name: "",
    description: ""
  });

  // Fetch structures
  const { data: structures = [], isLoading } = useQuery({
    queryKey: ['structures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('structures')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Structure[];
    },
  });

  // Add structure mutation
  const addStructure = useMutation({
    mutationFn: async (structure: {name: string, description: string}) => {
      const { data, error } = await supabase
        .from('structures')
        .insert([
          { 
            name: structure.name,
            description: structure.description || null
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['structures'] });
      toast({
        title: "Structure ajoutée",
        description: "La structure a été ajoutée avec succès"
      });
      setIsAddDialogOpen(false);
      setNewStructure({ name: "", description: "" });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: (error as Error).message || "Une erreur est survenue",
        variant: "destructive"
      });
    }
  });

  // Update structure mutation
  const updateStructure = useMutation({
    mutationFn: async (structure: Structure) => {
      const { data, error } = await supabase
        .from('structures')
        .update({
          name: structure.name,
          description: structure.description
        })
        .eq('id', structure.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['structures'] });
      toast({
        title: "Structure mise à jour",
        description: "La structure a été mise à jour avec succès"
      });
      setIsEditDialogOpen(false);
      setEditingStructure(null);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: (error as Error).message || "Une erreur est survenue",
        variant: "destructive"
      });
    }
  });

  // Delete structure mutation
  const deleteStructure = useMutation({
    mutationFn: async (structureId: string) => {
      // First, check if there are any templates using this structure
      const { data: templates, error: templateError } = await supabase
        .from('templates')
        .select('id')
        .eq('structure_id', structureId);
      
      if (templateError) throw templateError;
      
      if (templates && templates.length > 0) {
        throw new Error(`Impossible de supprimer cette structure : ${templates.length} template(s) y sont associés`);
      }
      
      // If no templates are associated, delete the structure
      const { error } = await supabase
        .from('structures')
        .delete()
        .eq('id', structureId);
      
      if (error) throw error;
      return structureId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['structures'] });
      toast({
        title: "Structure supprimée",
        description: "La structure a été supprimée avec succès"
      });
      setDeleteStructureId(null);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: (error as Error).message || "Une erreur est survenue",
        variant: "destructive"
      });
      setDeleteStructureId(null);
    }
  });

  const handleAddStructure = () => {
    if (!newStructure.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de la structure est requis",
        variant: "destructive"
      });
      return;
    }
    addStructure.mutate(newStructure);
  };

  const handleUpdateStructure = () => {
    if (!editingStructure || !editingStructure.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de la structure est requis",
        variant: "destructive"
      });
      return;
    }
    updateStructure.mutate(editingStructure);
  };

  const handleDeleteStructure = () => {
    if (deleteStructureId) {
      deleteStructure.mutate(deleteStructureId);
    }
  };

  const handleEditClick = (structure: Structure) => {
    setEditingStructure(structure);
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Gestion des structures</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Ajouter une structure
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Structures</CardTitle>
          <CardDescription>
            Les structures permettent de gérer les permissions et de regrouper les templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {structures.length === 0 ? (
            <div className="text-center py-8">
              <Building className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Aucune structure</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Commencez par ajouter une nouvelle structure
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> Ajouter une structure
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {structures.map((structure) => (
                <div key={structure.id} className="flex items-center justify-between p-4 border rounded-md">
                  <div>
                    <div className="font-medium">{structure.name}</div>
                    {structure.description && (
                      <div className="text-sm text-muted-foreground mt-1">{structure.description}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onManageUsers(structure.id, structure.name)}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Utilisateurs
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditClick(structure)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setDeleteStructureId(structure.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Structure Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une structure</DialogTitle>
            <DialogDescription>
              Créez une nouvelle structure pour organiser vos templates
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="structure-name">Nom de la structure</Label>
              <Input 
                id="structure-name" 
                value={newStructure.name}
                onChange={(e) => setNewStructure({...newStructure, name: e.target.value})}
                placeholder="Ex: Siège Social, Agence Paris, etc."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="structure-description">Description (optionnelle)</Label>
              <Textarea 
                id="structure-description" 
                value={newStructure.description}
                onChange={(e) => setNewStructure({...newStructure, description: e.target.value})}
                placeholder="Description de la structure"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleAddStructure}>Ajouter la structure</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Structure Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la structure</DialogTitle>
            <DialogDescription>
              Modifiez les informations de la structure
            </DialogDescription>
          </DialogHeader>
          
          {editingStructure && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-structure-name">Nom de la structure</Label>
                <Input 
                  id="edit-structure-name" 
                  value={editingStructure.name}
                  onChange={(e) => setEditingStructure({...editingStructure, name: e.target.value})}
                  placeholder="Ex: Siège Social, Agence Paris, etc."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-structure-description">Description (optionnelle)</Label>
                <Textarea 
                  id="edit-structure-description" 
                  value={editingStructure.description || ''}
                  onChange={(e) => setEditingStructure({...editingStructure, description: e.target.value})}
                  placeholder="Description de la structure"
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleUpdateStructure}>Mettre à jour</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteStructureId} onOpenChange={(open) => !open && setDeleteStructureId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La structure sera définitivement supprimée.
              Les templates associés à cette structure seront conservés mais n'appartiendront plus à aucune structure.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStructure} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
