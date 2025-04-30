
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';
import { EducationalProject, ProjectObjective, ProjectNote, ProjectEventLog, ProjectStatus } from '@/types/casf';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from './useAuditLog';

interface UseEducationalProjectProps {
  profileId: string;
  projectId?: string;
}

export function useEducationalProject({ profileId, projectId }: UseEducationalProjectProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  
  // State for tracking loading states
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Fetch projects
  const {
    data: projects = [],
    isLoading: isLoadingProjects,
    refetch: refetchProjects
  } = useQuery({
    queryKey: ['projects', profileId],
    queryFn: () => projectService.getProjects(profileId),
    enabled: !!profileId,
  });
  
  // Fetch single project with objectives
  const {
    data: project,
    isLoading: isLoadingProject,
    refetch: refetchProject
  } = useQuery({
    queryKey: ['project', projectId],
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
  });
  
  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: ({ projectData, userId }: { 
      projectData: Omit<EducationalProject, 'id' | 'created_at' | 'updated_at'>, 
      userId: string 
    }) => {
      setIsCreating(true);
      return projectService.createProject(projectData, userId);
    },
    onSuccess: (data) => {
      toast({
        title: "Projet créé",
        description: "Le projet a été créé avec succès"
      });
      
      logAction('create', 'project', data.id, { title: data.title });
      
      queryClient.invalidateQueries({ queryKey: ['projects', profileId] });
      return data;
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du projet",
        variant: "destructive"
      });
      console.error("Error creating project:", error);
    },
    onSettled: () => {
      setIsCreating(false);
    }
  });
  
  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: ({ projectId, updates, userId }: { 
      projectId: string, 
      updates: Partial<Omit<EducationalProject, 'id' | 'profile_id' | 'created_at' | 'created_by'>>,
      userId: string
    }) => {
      setIsUpdating(true);
      return projectService.updateProject(projectId, updates, userId);
    },
    onSuccess: (data) => {
      toast({
        title: "Projet mis à jour",
        description: "Le projet a été mis à jour avec succès"
      });
      
      logAction('update', 'project', data.id, { title: data.title });
      
      queryClient.invalidateQueries({ queryKey: ['project', data.id] });
      queryClient.invalidateQueries({ queryKey: ['projects', profileId] });
      return data;
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du projet",
        variant: "destructive"
      });
      console.error("Error updating project:", error);
    },
    onSettled: () => {
      setIsUpdating(false);
    }
  });
  
  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: ({ projectId, userId }: { projectId: string, userId: string }) => {
      setIsDeleting(true);
      return projectService.deleteProject(projectId, userId);
    },
    onSuccess: (_, { projectId }) => {
      toast({
        title: "Projet supprimé",
        description: "Le projet a été supprimé avec succès"
      });
      
      logAction('delete', 'project', projectId);
      
      queryClient.invalidateQueries({ queryKey: ['projects', profileId] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression du projet",
        variant: "destructive"
      });
      console.error("Error deleting project:", error);
    },
    onSettled: () => {
      setIsDeleting(false);
    }
  });
  
  // Objective mutations
  const addObjectiveMutation = useMutation({
    mutationFn: ({ objective, userId }: {
      objective: Omit<ProjectObjective, 'id' | 'created_at' | 'updated_at'>,
      userId: string
    }) => {
      return projectService.createObjective(objective, userId);
    },
    onSuccess: (data) => {
      toast({
        title: "Objectif ajouté",
        description: "L'objectif a été ajouté avec succès"
      });
      
      logAction('create', 'objective', data.id, { 
        title: data.title,
        projectId: data.project_id 
      });
      
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      }
      
      return data;
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
  
  const updateObjectiveMutation = useMutation({
    mutationFn: ({ objectiveId, updates, userId }: {
      objectiveId: string, 
      updates: Partial<Omit<ProjectObjective, 'id' | 'project_id' | 'created_at'>>,
      userId: string
    }) => {
      return projectService.updateObjective(objectiveId, updates, userId);
    },
    onSuccess: (data) => {
      toast({
        title: "Objectif mis à jour",
        description: "L'objectif a été mis à jour avec succès"
      });
      
      logAction('update', 'objective', data.id, { 
        title: data.title,
        projectId: data.project_id 
      });
      
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      }
      
      return data;
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
  
  const deleteObjectiveMutation = useMutation({
    mutationFn: ({ objectiveId, userId }: { objectiveId: string, userId: string }) => {
      return projectService.deleteObjective(objectiveId, userId);
    },
    onSuccess: (_, { objectiveId }) => {
      toast({
        title: "Objectif supprimé",
        description: "L'objectif a été supprimé avec succès"
      });
      
      logAction('delete', 'objective', objectiveId);
      
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      }
      
      return true;
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
  
  // Project notes mutations
  const addNoteMutation = useMutation({
    mutationFn: ({ note, userId }: {
      note: Omit<ProjectNote, 'id' | 'created_at'>,
      userId: string
    }) => {
      return projectService.addProjectNote(note, userId);
    },
    onSuccess: (data) => {
      toast({
        title: "Note ajoutée",
        description: "La note a été ajoutée avec succès"
      });
      
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      }
      
      return data;
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout de la note",
        variant: "destructive"
      });
      console.error("Error adding note:", error);
    }
  });
  
  // Handle project operations
  const createProject = (projectData: Omit<EducationalProject, 'id' | 'created_at' | 'updated_at'>, userId: string) => {
    return createProjectMutation.mutateAsync({ projectData, userId });
  };
  
  const updateProject = (projectId: string, updates: Partial<Omit<EducationalProject, 'id' | 'profile_id' | 'created_at' | 'created_by'>>, userId: string) => {
    return updateProjectMutation.mutateAsync({ projectId, updates, userId });
  };
  
  const deleteProject = (projectId: string, userId: string) => {
    return deleteProjectMutation.mutateAsync({ projectId, userId });
  };
  
  // Handle objectives operations
  const addObjective = (objective: Omit<ProjectObjective, 'id' | 'created_at' | 'updated_at'>, userId: string) => {
    return addObjectiveMutation.mutateAsync({ objective, userId });
  };
  
  const updateObjective = (objectiveId: string, updates: Partial<Omit<ProjectObjective, 'id' | 'project_id' | 'created_at'>>, userId: string) => {
    return updateObjectiveMutation.mutateAsync({ objectiveId, updates, userId });
  };
  
  const deleteObjective = (objectiveId: string, userId: string) => {
    return deleteObjectiveMutation.mutateAsync({ objectiveId, userId });
  };
  
  // Handle notes operations
  const addNote = (note: Omit<ProjectNote, 'id' | 'created_at'>, userId: string) => {
    return addNoteMutation.mutateAsync({ note, userId });
  };
  
  // Filter projects by status
  const getProjectsByStatus = (status: ProjectStatus | ProjectStatus[]) => {
    const statusArray = Array.isArray(status) ? status : [status];
    return projects.filter(p => statusArray.includes(p.status as ProjectStatus));
  };
  
  return {
    // Data
    projects,
    project,
    
    // Loading states
    isLoadingProjects,
    isLoadingProject,
    isCreating,
    isUpdating,
    isDeleting,
    
    // Refetch methods
    refetchProjects,
    refetchProject,
    
    // Project operations
    createProject,
    updateProject,
    deleteProject,
    getProjectsByStatus,
    
    // Objective operations
    addObjective,
    updateObjective,
    deleteObjective,
    
    // Note operations
    addNote
  };
}
