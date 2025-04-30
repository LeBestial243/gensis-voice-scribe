
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

// We need to create the ObjectiveForm component to complete this
<lov-write file_path="src/components/casf/projects/ObjectiveForm.tsx">
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProjectObjective, ObjectiveStatus } from '@/types/projects';
import { Calendar, Loader2, Save } from 'lucide-react';

const objectiveFormSchema = z.object({
  title: z.string().min(3, { message: 'Le titre doit contenir au moins 3 caractères' }),
  description: z.string().optional(),
  status: z.string(),
  target_date: z.string(),
  notes: z.string().optional(),
});

type ObjectiveFormValues = z.infer<typeof objectiveFormSchema>;

interface ObjectiveFormProps {
  initialData?: Partial<ProjectObjective>;
  onSubmit: (data: Omit<ProjectObjective, 'id' | 'created_at' | 'updated_at'>) => void;
  projectId: string;
  isLoading?: boolean;
}

export function ObjectiveForm({ 
  initialData, 
  onSubmit, 
  projectId, 
  isLoading = false 
}: ObjectiveFormProps) {
  
  // Get today for default date
  const today = new Date();
  
  // Format date to YYYY-MM-DD
  const formatDateForInput = (date: Date) => date.toISOString().split('T')[0];
  
  const form = useForm<ObjectiveFormValues>({
    resolver: zodResolver(objectiveFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      status: initialData?.status || 'not_started',
      target_date: initialData?.target_date ? new Date(initialData.target_date).toISOString().split('T')[0] : formatDateForInput(today),
      notes: initialData?.notes || '',
    }
  });
  
  const handleSubmit = (values: ObjectiveFormValues) => {
    onSubmit({
      ...values,
      project_id: projectId,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre de l'objectif</FormLabel>
              <FormControl>
                <Input placeholder="Titre de l'objectif" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Description détaillée de l'objectif" 
                  className="min-h-[80px]" 
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Statut</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Non commencé</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                    <SelectItem value="cancelled">Annulé</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="target_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date cible</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="date" 
                      className="pl-9" 
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Notes additionnelles" 
                  className="min-h-[80px]" 
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                Informations supplémentaires ou remarques sur l'objectif.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
