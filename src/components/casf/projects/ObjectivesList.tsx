
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProjectObjective, ObjectiveStatus } from '@/types/projects';
import { Calendar, CheckCircle, Clock, PlusCircle, XCircle, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ObjectiveForm } from './ObjectiveForm';
import { useToast } from '@/hooks/use-toast';

interface ObjectivesListProps {
  objectives: ProjectObjective[];
  projectId: string;
  onAddObjective: (objective: Omit<ProjectObjective, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdateObjective: (objectiveId: string, updates: Partial<Omit<ProjectObjective, 'id' | 'project_id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  onDeleteObjective: (objectiveId: string) => Promise<void>;
}

export function ObjectivesList({ 
  objectives, 
  projectId, 
  onAddObjective,
  onUpdateObjective,
  onDeleteObjective
}: ObjectivesListProps) {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [objectiveToEdit, setObjectiveToEdit] = useState<ProjectObjective | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleAddObjective = async (data: Omit<ProjectObjective, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setIsLoading(true);
      await onAddObjective({ ...data, project_id: projectId });
      setIsAddDialogOpen(false);
      toast({
        title: "Objectif ajouté",
        description: "L'objectif a été ajouté avec succès."
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout de l'objectif.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateObjective = async (data: Partial<Omit<ProjectObjective, 'id' | 'project_id' | 'created_at' | 'updated_at'>>) => {
    if (!objectiveToEdit) return;
    
    try {
      setIsLoading(true);
      await onUpdateObjective(objectiveToEdit.id, data);
      setObjectiveToEdit(null);
      toast({
        title: "Objectif mis à jour",
        description: "L'objectif a été mis à jour avec succès."
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de l'objectif.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteObjective = async (objectiveId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet objectif ?")) return;
    
    try {
      await onDeleteObjective(objectiveId);
      toast({
        title: "Objectif supprimé",
        description: "L'objectif a été supprimé avec succès."
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'objectif.",
        variant: "destructive"
      });
    }
  };
  
  const renderStatusBadge = (status: ObjectiveStatus | string) => {
    switch (status) {
      case 'not_started':
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Non commencé</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> En cours</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Terminé</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Annulé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };
  
  const sortedObjectives = [...objectives].sort((a, b) => {
    // First sort by status priority: not_started -> in_progress -> completed -> cancelled
    const statusPriority: Record<string, number> = {
      not_started: 0,
      in_progress: 1,
      completed: 2,
      cancelled: 3
    };
    
    const statusA = statusPriority[a.status] || 999;
    const statusB = statusPriority[b.status] || 999;
    
    if (statusA !== statusB) return statusA - statusB;
    
    // Then sort by target date (ascending)
    return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Objectifs du projet</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              Ajouter un objectif
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Ajouter un objectif</DialogTitle>
            </DialogHeader>
            <ObjectiveForm 
              onSubmit={handleAddObjective} 
              projectId={projectId}
              isLoading={isLoading}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {sortedObjectives.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun objectif défini pour ce projet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Date cible</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedObjectives.map((objective) => (
                  <TableRow key={objective.id}>
                    <TableCell className="font-medium">{objective.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(objective.target_date)}
                      </div>
                    </TableCell>
                    <TableCell>{renderStatusBadge(objective.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog open={objectiveToEdit?.id === objective.id} onOpenChange={(open) => {
                          if (!open) setObjectiveToEdit(null);
                          else setObjectiveToEdit(objective);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                              <DialogTitle>Modifier l'objectif</DialogTitle>
                            </DialogHeader>
                            {objectiveToEdit && (
                              <ObjectiveForm 
                                initialData={objectiveToEdit}
                                onSubmit={handleUpdateObjective} 
                                projectId={projectId}
                                isLoading={isLoading}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteObjective(objective.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
