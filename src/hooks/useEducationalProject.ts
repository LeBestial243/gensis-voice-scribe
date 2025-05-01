
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectService } from "@/services/projectService";
import { 
  EducationalProject, 
  ProjectObjective, 
  ProjectNote, 
  ProjectStatus,
  ObjectiveStatus
} from "@/types/casf";
import { useToast } from "@/hooks/use-toast";

// Properly type the hook parameters
interface UseEducationalProjectProps {
  profileId: string;
  projectId?: string;
}

export function useEducationalProject({ profileId, projectId }: UseEducationalProjectProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // État pour le formulaire de projet
  const [projectForm, setProjectForm] = useState<Partial<EducationalProject>>({
    profile_id: profileId,
    title: "",
    objectives: "",
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(), // +6 mois
    status: "planned" as ProjectStatus,
    confidentiality_level: "restricted"
  });
  
  // État pour le formulaire d'objectif
  const [objectiveForm, setObjectiveForm] = useState<Partial<ProjectObjective>>({
    title: "",
    description: "",
    target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +1 mois
    status: "not_started" as ObjectiveStatus,
    progress: 0
  });
  
  const [noteContent, setNoteContent] = useState("");
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | null>(null);
  
  // Requête pour tous les projets du profil
  const projectsQuery = useQuery({
    queryKey: ['educational_projects', profileId],
    queryFn: () => projectService.getProjects(profileId),
    enabled: !!profileId
  });
  
  // Requête pour un projet spécifique
  const projectQuery = useQuery({
    queryKey: ['educational_project', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const projectData = await projectService.getProjectById(projectId);
      const objectives = await projectService.getProjectObjectives(projectId);
      const notes = await projectService.getProjectNotes(projectId);
      const events = await projectService.getProjectEventLogs(projectId);
      
      return {
        ...projectData,
        objectives_list: objectives,
        notes,
        events
      };
    },
    enabled: !!projectId
  });
  
  // Update form data when project data is loaded
  if (projectId && projectQuery.data) {
    // Ensure we don't trigger infinite loop by checking if form is different
    if (projectForm.title !== projectQuery.data.title || 
        projectForm.objectives !== projectQuery.data.objectives ||
        projectForm.status !== projectQuery.data.status ||
        projectForm.start_date !== projectQuery.data.start_date ||
        projectForm.end_date !== projectQuery.data.end_date) {
      setProjectForm({
        ...projectQuery.data,
        // Don't override profile_id to prevent changing the profile
        profile_id: profileId
      });
    }
  }
  
  // Requête pour les objectifs du projet
  const objectivesQuery = useQuery({
    queryKey: ['project_objectives', projectId],
    queryFn: () => projectService.getProjectObjectives(projectId!),
    enabled: !!projectId
  });
  
  // Requête pour les notes du projet
  const notesQuery = useQuery({
    queryKey: ['project_notes', projectId, selectedObjectiveId],
    queryFn: () => projectService.getProjectNotes(projectId!, selectedObjectiveId || undefined),
    enabled: !!projectId
  });
  
  // Requête pour le journal d'événements
  const eventsQuery = useQuery({
    queryKey: ['project_events', projectId, selectedObjectiveId],
    queryFn: () => projectService.getProjectEventLogs(projectId!, selectedObjectiveId || undefined),
    enabled: !!projectId
  });
  
  // Mutation pour créer un projet
  const createProjectMutation = useMutation({
    mutationFn: (data: { projectData: Omit<EducationalProject, 'id' | 'created_at' | 'updated_at'>, userId: string }) => 
      projectService.createProject(data.projectData, data.userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['educational_projects', profileId] });
      toast({
        title: "Projet créé",
        description: "Le projet éducatif a été créé avec succès."
      });
      return data;
    }
  });
  
  // Mutation pour mettre à jour un projet
  const updateProjectMutation = useMutation({
    mutationFn: (data: { projectId: string, updates: Partial<EducationalProject>, userId: string }) => 
      projectService.updateProject(data.projectId, data.updates, data.userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['educational_project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['educational_projects', profileId] });
      toast({
        title: "Projet mis à jour",
        description: "Le projet éducatif a été mis à jour avec succès."
      });
      return data;
    }
  });
  
  // Mutation pour supprimer un projet
  const deleteProjectMutation = useMutation({
    mutationFn: (data: { projectId: string, userId: string }) => 
      projectService.deleteProject(data.projectId, data.userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['educational_projects', profileId] });
      toast({
        title: "Projet supprimé",
        description: "Le projet éducatif a été supprimé avec succès."
      });
    }
  });
  
  // Mutation pour créer un objectif
  const addObjectiveMutation = useMutation({
    mutationFn: (data: { objective: Omit<ProjectObjective, 'id' | 'created_at' | 'updated_at'>, userId: string }) => 
      projectService.createObjective(data.objective, data.userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project_objectives', projectId] });
      queryClient.invalidateQueries({ queryKey: ['educational_project', projectId] });
      toast({
        title: "Objectif ajouté",
        description: "L'objectif a été ajouté avec succès."
      });
      // Reset form
      setObjectiveForm({
        title: "",
        description: "",
        target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: "not_started" as ObjectiveStatus,
        progress: 0
      });
      return data;
    }
  });
  
  // Mutation pour mettre à jour un objectif
  const updateObjectiveMutation = useMutation({
    mutationFn: (data: { objectiveId: string, updates: Partial<ProjectObjective>, userId: string }) => 
      projectService.updateObjective(data.objectiveId, data.updates, data.userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project_objectives', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project_events', projectId] });
      queryClient.invalidateQueries({ queryKey: ['educational_project', projectId] });
      toast({
        title: "Objectif mis à jour",
        description: "L'objectif a été mis à jour avec succès."
      });
      return data;
    }
  });
  
  // Mutation pour supprimer un objectif
  const deleteObjectiveMutation = useMutation({
    mutationFn: (data: { objectiveId: string, userId: string }) => 
      projectService.deleteObjective(data.objectiveId, data.userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project_objectives', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project_events', projectId] });
      queryClient.invalidateQueries({ queryKey: ['educational_project', projectId] });
      toast({
        title: "Objectif supprimé",
        description: "L'objectif a été supprimé avec succès."
      });
    }
  });
  
  // Mutation pour ajouter une note
  const addNoteMutation = useMutation({
    mutationFn: (data: { note: Omit<ProjectNote, 'id' | 'created_at'>, userId: string }) => 
      projectService.addProjectNote(data.note, data.userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project_notes', projectId, selectedObjectiveId] });
      queryClient.invalidateQueries({ queryKey: ['project_events', projectId] });
      queryClient.invalidateQueries({ queryKey: ['educational_project', projectId] });
      toast({
        title: "Note ajoutée",
        description: "La note a été ajoutée avec succès."
      });
      setNoteContent("");
      return data;
    }
  });
  
  // Calculer les statistiques du projet
  const calculateProjectStats = () => {
    if (!objectivesQuery.data) return { totalObjectives: 0, completedObjectives: 0, progress: 0 };
    
    const totalObjectives = objectivesQuery.data.length;
    const completedObjectives = objectivesQuery.data.filter(
      obj => obj.status === 'completed'
    ).length;
    
    const progress = totalObjectives === 0 
      ? 0 
      : Math.round((completedObjectives / totalObjectives) * 100);
    
    return {
      totalObjectives,
      completedObjectives,
      progress
    };
  };
  
  // Fonctions utilitaires
  const createProject = (projectData: Omit<EducationalProject, 'id' | 'created_at' | 'updated_at'>, userId: string): Promise<void> => {
    return createProjectMutation.mutateAsync({ projectData, userId }).then(() => {});
  };
  
  const updateProject = (projectId: string, updates: Partial<EducationalProject>, userId: string): Promise<void> => {
    return updateProjectMutation.mutateAsync({ projectId, updates, userId }).then(() => {});
  };
  
  const deleteProject = (projectId: string, userId: string): Promise<void> => {
    return deleteProjectMutation.mutateAsync({ projectId, userId }).then(() => {});
  };
  
  const addObjective = (objective: Omit<ProjectObjective, 'id' | 'created_at' | 'updated_at'>, userId: string): Promise<void> => {
    return addObjectiveMutation.mutateAsync({ objective, userId }).then(() => {});
  };
  
  const updateObjective = (objectiveId: string, updates: Partial<ProjectObjective>, userId: string): Promise<void> => {
    return updateObjectiveMutation.mutateAsync({ objectiveId, updates, userId }).then(() => {});
  };
  
  const deleteObjective = (objectiveId: string, userId: string): Promise<void> => {
    return deleteObjectiveMutation.mutateAsync({ objectiveId, userId }).then(() => {});
  };
  
  const addNote = (userId: string): Promise<void> => {
    return addNoteMutation.mutateAsync({ 
      note: {
        project_id: projectId!,
        objective_id: selectedObjectiveId || undefined,
        content: noteContent
      }, 
      userId 
    }).then(() => {});
  };
  
  // Filter projects by status
  const getProjectsByStatus = (status: ProjectStatus | ProjectStatus[]) => {
    if (!projectsQuery.data) return [];
    const statusArray = Array.isArray(status) ? status : [status];
    return projectsQuery.data.filter(p => statusArray.includes(p.status as ProjectStatus));
  };
  
  return {
    // Données
    projects: projectsQuery.data || [],
    project: projectQuery.data,
    objectives: objectivesQuery.data || [],
    notes: notesQuery.data || [],
    events: eventsQuery.data || [],
    projectStats: calculateProjectStats(),
    
    // Formulaires
    projectForm,
    objectiveForm,
    noteContent,
    selectedObjectiveId,
    
    // États
    isLoadingProjects: projectsQuery.isLoading,
    isLoadingProject: projectQuery.isLoading,
    isLoadingObjectives: objectivesQuery.isLoading,
    isCreatingProject: createProjectMutation.isPending,
    isUpdatingProject: updateProjectMutation.isPending,
    isCreatingObjective: addObjectiveMutation.isPending,
    isUpdatingObjective: updateObjectiveMutation.isPending,
    isAddingNote: addNoteMutation.isPending,
    isDeleting: deleteProjectMutation.isPending,
    
    // Actions
    setProjectForm,
    setObjectiveForm,
    setNoteContent,
    setSelectedObjectiveId,
    createProject,
    updateProject,
    deleteProject,
    addObjective,
    updateObjective,
    deleteObjective,
    addNote,
    getProjectsByStatus,
    
    // Refetch methods
    refetchProjects: projectsQuery.refetch,
    refetchProject: projectQuery.refetch
  };
}
