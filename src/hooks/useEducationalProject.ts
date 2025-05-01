
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
    enabled: !!projectId,
    onSuccess: (data) => {
      if (data) {
        // Mettre à jour le formulaire avec les données du projet
        setProjectForm({
          ...data,
          // Ne pas écraser profile_id pour éviter de changer le profil
          profile_id: profileId
        });
      }
    }
  });
  
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
    mutationFn: (userId: string) => 
      projectService.createProject({
        ...projectForm as Omit<EducationalProject, 'id' | 'created_at' | 'updated_at'>,
        status: projectForm.status as ProjectStatus
      }, userId),
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
    mutationFn: ({ userId }: { userId: string }) => 
      projectService.updateProject(
        projectId!, 
        {
          ...projectForm as Partial<Omit<EducationalProject, 'id' | 'profile_id' | 'created_at' | 'created_by'>>,
          status: projectForm.status as ProjectStatus
        }, 
        userId
      ),
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
  
  // Mutation pour créer un objectif
  const createObjectiveMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) => 
      projectService.createObjective({
        ...objectiveForm as Omit<ProjectObjective, 'id' | 'created_at' | 'updated_at'>,
        project_id: projectId!,
        status: objectiveForm.status as ObjectiveStatus
      }, userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project_objectives', projectId] });
      queryClient.invalidateQueries({ queryKey: ['educational_project', projectId] });
      toast({
        title: "Objectif ajouté",
        description: "L'objectif a été ajouté avec succès."
      });
      // Réinitialiser le formulaire
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
    mutationFn: ({ objectiveId, updates, userId }: { 
      objectiveId: string; 
      updates: Partial<ProjectObjective>;
      userId: string;
    }) => 
      projectService.updateObjective(objectiveId, {
        ...updates,
        status: updates.status as ObjectiveStatus
      }, userId),
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
  
  // Mutation pour ajouter une note
  const addNoteMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) => 
      projectService.addProjectNote({
        project_id: projectId!,
        objective_id: selectedObjectiveId || undefined,
        content: noteContent
      }, userId),
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
  const createProject = (userId: string) => {
    return createProjectMutation.mutateAsync(userId);
  };
  
  const updateProject = (userId: string) => {
    return updateProjectMutation.mutateAsync({ userId });
  };
  
  const createObjective = (userId: string) => {
    return createObjectiveMutation.mutateAsync({ userId });
  };
  
  const updateObjectiveStatus = (objectiveId: string, status: ObjectiveStatus, userId: string) => {
    return updateObjectiveMutation.mutateAsync({
      objectiveId,
      updates: { status },
      userId
    });
  };
  
  const updateObjectiveProgress = (objectiveId: string, progress: number, userId: string) => {
    return updateObjectiveMutation.mutateAsync({
      objectiveId,
      updates: { progress },
      userId
    });
  };
  
  const addNote = (userId: string) => {
    return addNoteMutation.mutateAsync({ userId });
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
    isCreatingObjective: createObjectiveMutation.isPending,
    isUpdatingObjective: updateObjectiveMutation.isPending,
    isAddingNote: addNoteMutation.isPending,
    
    // Actions
    setProjectForm,
    setObjectiveForm,
    setNoteContent,
    setSelectedObjectiveId,
    createProject,
    updateProject,
    createObjective,
    updateObjectiveStatus,
    updateObjectiveProgress,
    addNote,
    getProjectsByStatus,
    
    // Refetch methods
    refetchProjects: projectsQuery.refetch,
    refetchProject: projectQuery.refetch
  };
}
