import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { EducationalProjectForm } from '@/components/casf/projects/EducationalProjectForm';
import { ObjectivesList } from '@/components/casf/projects/ObjectivesList';
import { ProjectTimeline } from '@/components/casf/projects/ProjectTimeline';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AuditLogViewer } from '@/components/casf/confidentiality/AuditLogViewer';
import { ProjectWithObjectives, ProjectObjective } from '@/types/projects';
import { ArrowLeft, Loader2, Clock, FileText, Calendar, Check } from 'lucide-react';

export default function EducationalProjectPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  
  // Get the profile ID and project data
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      
      // Get project details
      const projectData = await projectService.getProjectById(projectId);
      
      // Get project objectives
      const objectives = await projectService.getProjectObjectives(projectId);
      
      return {
        ...projectData,
        objectives
      } as ProjectWithObjectives;
    },
    enabled: !!projectId,
  });
  
  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: (data: any) => projectService.updateProject(projectId!, data),
    onSuccess: () => {
      toast({
        title: "Projet mis à jour",
        description: "Le projet a été mis à jour avec succès"
      });
      setIsEditProjectOpen(false);
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du projet",
        variant: "destructive"
      });
      console.error("Error updating project:", error);
    }
  });
  
  // Add objective mutation
  const addObjectiveMutation = useMutation({
    mutationFn: projectService.createObjective,
    onSuccess: () => {
      toast({
        title: "Objectif ajouté",
        description: "L'objectif a été ajouté avec succès"
      });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout de l'objectif",
        variant: "destructive"
      });
      console.error("Error adding objective:", error);
    }
  });
  
  // Update objective mutation
  const updateObjectiveMutation = useMutation({
    mutationFn: ({ objectiveId, updates }: { objectiveId: string, updates: any }) => 
      projectService.updateObjective(objectiveId, updates),
    onSuccess: () => {
      toast({
        title: "Objectif mis à jour",
        description: "L'objectif a été mis à jour avec succès"
      });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de l'objectif",
        variant: "destructive"
      });
      console.error("Error updating objective:", error);
    }
  });
  
  // Delete objective mutation
  const deleteObjectiveMutation = useMutation({
    mutationFn: projectService.deleteObjective,
    onSuccess: () => {
      toast({
        title: "Objectif supprimé",
        description: "L'objectif a été supprimé avec succès"
      });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'objectif",
        variant: "destructive"
      });
      console.error("Error deleting objective:", error);
    }
  });
  
  // Helper function to format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planned':
        return (
          <div className="flex items-center gap-1.5 text-blue-600">
            <Clock className="h-4 w-4" />
            <span>Planifié</span>
          </div>
        );
      case 'in_progress':
        return (
          <div className="flex items-center gap-1.5 text-amber-600">
            <Calendar className="h-4 w-4" />
            <span>En cours</span>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center gap-1.5 text-green-600">
            <Check className="h-4 w-4" />
            <span>Terminé</span>
          </div>
        );
      case 'cancelled':
        return (
          <div className="flex items-center gap-1.5 text-red-600">
            <FileText className="h-4 w-4" />
            <span>Annulé</span>
          </div>
        );
      default:
        return status;
    }
  };
  
  // Calculate progress based on objectives
  const calculateProgress = () => {
    if (!project?.objectives?.length) return 0;
    
    const totalObjectives = project.objectives.length;
    const completedObjectives = project.objectives.filter(
      obj => obj.status === 'completed'
    ).length;
    
    return Math.round((completedObjectives / totalObjectives) * 100);
  };

  if (isLoadingProject) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center p-12">
          <h2 className="text-2xl font-bold mb-4">Projet non trouvé</h2>
          <p className="text-muted-foreground mb-6">
            Le projet que vous recherchez n'existe pas ou a été supprimé.
          </p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 pb-24">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{project.title}</h1>
            <div className="flex items-center mt-2 gap-4">
              {getStatusBadge(project.status)}
              <span className="text-muted-foreground">
                {formatDate(project.start_date)} - {formatDate(project.end_date)}
              </span>
            </div>
          </div>
          
          <Button onClick={() => setIsEditProjectOpen(true)}>
            Modifier le projet
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Progression globale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    className="text-muted/20"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                  {/* Progress circle */}
                  <circle
                    className="text-primary"
                    strokeWidth="10"
                    strokeDasharray={`${calculateProgress() * 2.51} 251.2`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">{calculateProgress()}%</span>
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {project.objectives?.filter(obj => obj.status === 'completed').length || 0} sur {project.objectives?.length || 0} objectifs terminés
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>À propos du projet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Objectifs généraux</h3>
                <p className="mt-1">{project?.objectives || "Aucun objectif général défini."}</p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Détails</h3>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <p className="text-xs text-muted-foreground">Date de début</p>
                    <p>{project ? formatDate(project.start_date) : ''}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date de fin</p>
                    <p>{project ? formatDate(project.end_date) : ''}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="objectives" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="objectives">Objectifs</TabsTrigger>
          <TabsTrigger value="timeline">Chronologie</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>
        
        <TabsContent value="objectives" className="mt-6">
          <ObjectivesList 
            objectives={project?.objectives || []}
            projectId={project?.id || ''}
            onAddObjective={async (objective) => {
              await addObjectiveMutation.mutateAsync(objective);
              return;
            }}
            onUpdateObjective={async (objectiveId, updates) => {
              await updateObjectiveMutation.mutateAsync({ objectiveId, updates });
              return;
            }}
            onDeleteObjective={async (objectiveId) => {
              await deleteObjectiveMutation.mutateAsync(objectiveId);
              return;
            }}
          />
        </TabsContent>
        
        <TabsContent value="timeline" className="mt-6">
          <ProjectTimeline 
            objectives={project.objectives || []}
            startDate={project.start_date}
            endDate={project.end_date}
          />
        </TabsContent>
        
        <TabsContent value="history" className="mt-6">
          <AuditLogViewer 
            resourceType="project"
            resourceId={project.id}
          />
        </TabsContent>
      </Tabs>
      
      <Dialog open={isEditProjectOpen} onOpenChange={setIsEditProjectOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Modifier le projet</DialogTitle>
          </DialogHeader>
          {project && (
            <EducationalProjectForm
              initialData={{
                title: project.title,
                objectives: typeof project.objectives === 'string' ? project.objectives : '',
                status: project.status,
                start_date: project.start_date,
                end_date: project.end_date,
                profile_id: project.profile_id
              }}
              onSubmit={(data) => updateProjectMutation.mutate(data)}
              profileId={project.profile_id}
              isLoading={updateProjectMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
