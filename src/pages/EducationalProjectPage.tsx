
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEducationalProject } from '@/hooks/useEducationalProject';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { EducationalProjectForm } from '@/components/casf/projects/EducationalProjectForm';
import { ObjectivesList } from '@/components/casf/projects/ObjectivesList';
import { ProjectTimeline } from '@/components/casf/projects/ProjectTimeline';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AuditLogViewer } from '@/components/casf/confidentiality/AuditLogViewer';
import { ArrowLeft, Loader2, Clock, FileText, Calendar, Check } from 'lucide-react';
import { ProjectStatus, ObjectiveStatus } from '@/types/casf';

export default function EducationalProjectPage() {
  const { id: profileId, projectId } = useParams<{ id?: string; projectId?: string }>();
  const navigate = useNavigate();
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const { user } = useAuth();
  const userId = user?.id || '';
  
  const {
    // Data
    projects,
    project,
    
    // Loading states
    isLoadingProjects,
    isLoadingProject,
    isCreatingProject: isCreating,
    isUpdatingProject: isUpdating,
    isDeleting,
    
    // Project operations
    createProject,
    updateProject,
    deleteProject,
    
    // Objective operations
    addObjective,
    updateObjective,
    deleteObjective
  } = useEducationalProject({ 
    profileId: profileId || '', 
    projectId 
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
    if (!project?.objectives_list || !Array.isArray(project.objectives_list) || project.objectives_list.length === 0) return 0;
    
    const totalObjectives = project.objectives_list.length;
    const completedObjectives = project.objectives_list.filter(
      obj => obj.status === 'completed'
    ).length;
    
    return Math.round((completedObjectives / totalObjectives) * 100);
  };

  if (isLoadingProject || isLoadingProjects) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If we're looking for a specific project but it wasn't found
  if (projectId && !project) {
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

  // If we're viewing a project list (no specific project selected)
  if (!projectId) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Projets éducatifs</h1>
        
        <div className="flex justify-between items-center mb-6">
          <p className="text-muted-foreground">
            {projects.length} projet{projects.length !== 1 ? 's' : ''} trouvé{projects.length !== 1 ? 's' : ''}
          </p>
          <Button onClick={() => navigate(`/young_profiles/${profileId}/projects/new`)}>
            Créer un nouveau projet
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="line-clamp-2">{project.title}</CardTitle>
                <div className="flex items-center text-muted-foreground text-sm">
                  {getStatusBadge(project.status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                  {project.objectives || "Aucun objectif défini"}
                </p>
                <div className="flex justify-between text-sm">
                  <span>
                    Début: {formatDate(project.start_date)}
                  </span>
                  <span>
                    Fin: {formatDate(project.end_date)}
                  </span>
                </div>
              </CardContent>
              <div className="px-6 pb-6 pt-0">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate(`/young_profiles/${profileId}/projects/${project.id}`)}
                >
                  Voir le projet
                </Button>
              </div>
            </Card>
          ))}
          
          {projects.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-primary/10 p-3 mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-medium mb-2">Aucun projet</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Il n'y a pas encore de projets éducatifs pour ce profil. 
                Créez un nouveau projet pour commencer.
              </p>
              <Button onClick={() => navigate(`/young_profiles/${profileId}/projects/new`)}>
                Créer un projet
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If we're creating a new project
  if (projectId === 'new') {
    return (
      <div className="container mx-auto py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Button>
        
        <h1 className="text-3xl font-bold mb-6">Nouveau projet éducatif</h1>
        
        <Card>
          <CardContent className="pt-6">
            <EducationalProjectForm
              onSubmit={(data) => {
                // Fix: Cast status to ProjectStatus to satisfy TypeScript
                const completeData = {
                  title: data.title || "",
                  objectives: data.objectives || "",
                  status: data.status as ProjectStatus,
                  start_date: data.start_date || new Date().toISOString(),
                  end_date: data.end_date || new Date().toISOString(),
                  profile_id: profileId || ""
                };
                
                return createProject(completeData, userId).then((newProject) => {
                  if (newProject && newProject.id) {
                    navigate(`/young_profiles/${profileId}/projects/${newProject.id}`);
                  }
                });
              }}
              profileId={profileId || ''}
              isLoading={isCreating}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // View for a specific project
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
                  {project.objectives_list && Array.isArray(project.objectives_list) ? 
                    `${project.objectives_list.filter(obj => obj.status === 'completed').length} sur ${project.objectives_list.length} objectifs terminés` : 
                    "Aucun objectif défini"
                  }
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
                <p className="mt-1">
                  {typeof project.objectives === 'string' 
                    ? project.objectives 
                    : "Aucun objectif général défini."}
                </p>
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
            objectives={project.objectives_list && Array.isArray(project.objectives_list) ? project.objectives_list : []}
            projectId={project.id}
            onAddObjective={(objective) => {
              // Fix: Cast status to ObjectiveStatus
              const typedObjective = {
                ...objective,
                project_id: project.id,
                status: objective.status as ObjectiveStatus
              };
              return addObjective(typedObjective, userId);
            }}
            onUpdateObjective={(objectiveId, updates) => {
              // Fix: Cast status to ObjectiveStatus if it exists in updates
              const typedUpdates = {
                ...updates,
                status: updates.status ? updates.status as ObjectiveStatus : undefined
              };
              return updateObjective(objectiveId, typedUpdates, userId);
            }}
            onDeleteObjective={(objectiveId) => {
              return deleteObjective(objectiveId, userId);
            }}
          />
        </TabsContent>
        
        <TabsContent value="timeline" className="mt-6">
          <ProjectTimeline 
            objectives={project.objectives_list && Array.isArray(project.objectives_list) ? project.objectives_list : []}
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
              onSubmit={(data) => {
                // Fix: Cast status to ProjectStatus
                const typedData = {
                  ...data,
                  status: data.status as ProjectStatus
                };
                return updateProject(project.id, typedData, userId).then(() => {
                  setIsEditProjectOpen(false);
                });
              }}
              profileId={project.profile_id}
              isLoading={isUpdating}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
