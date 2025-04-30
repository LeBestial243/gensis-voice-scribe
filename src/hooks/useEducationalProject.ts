
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';
import { Project, ProjectObjective } from '@/types/projects';
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
      
      return {
        ...projectData,
        objectives
      };
    },
    enabled: !!projectId,
  });
  
  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
      setIsCreating(true);
      return projectService.createProject(projectData);
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
    mutationFn: ({ projectId, updates }: { 
      projectId: string, 
      updates: Partial<Omit<Project, 'id' | 'profile_id' | 'created_at' | 'updated_at'>>
    }) => {
      setIsUpdating(true);
      return projectService.updateProject(projectId, updates);
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
    mutationFn: (projectId: string) => {
      setIsDeleting(true);
      return projectService.deleteProject(projectId);
    },
    onSuccess: (_, projectId) => {
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
  
  // Handle project operations
  const createProject = (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    return createProjectMutation.mutateAsync(projectData);
  };
  
  const updateProject = (projectId: string, updates: Partial<Omit<Project, 'id' | 'profile_id' | 'created_at' | 'updated_at'>>) => {
    return updateProjectMutation.mutateAsync({ projectId, updates });
  };
  
  const deleteProject = (projectId: string) => {
    return deleteProjectMutation.mutateAsync(projectId);
  };

  // Handle objectives operations
  const addObjective = async (objective: Omit<ProjectObjective, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newObjective = await projectService.createObjective(objective);
      
      toast({
        title: "Objectif ajouté",
        description: "L'objectif a été ajouté avec succès"
      });
      
      logAction('create', 'objective', newObjective.id, { 
        title: newObjective.title,
        projectId: newObjective.project_id 
      });
      
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      }
      
      return newObjective;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout de l'objectif",
        variant: "destructive"
      });
      console.error("Error adding objective:", error);
      throw error;
    }
  };
  
  const updateObjective = async (objectiveId: string, updates: Partial<Omit<ProjectObjective, 'id' | 'project_id' | 'created_at' | 'updated_at'>>) => {
    try {
      const updatedObjective = await projectService.updateObjective(objectiveId, updates);
      
      toast({
        title: "Objectif mis à jour",
        description: "L'objectif a été mis à jour avec succès"
      });
      
      logAction('update', 'objective', updatedObjective.id, { 
        title: updatedObjective.title,
        projectId: updatedObjective.project_id 
      });
      
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      }
      
      return updatedObjective;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de l'objectif",
        variant: "destructive"
      });
      console.error("Error updating objective:", error);
      throw error;
    }
  };
  
  const deleteObjective = async (objectiveId: string) => {
    try {
      await projectService.deleteObjective(objectiveId);
      
      toast({
        title: "Objectif supprimé",
        description: "L'objectif a été supprimé avec succès"
      });
      
      logAction('delete', 'objective', objectiveId);
      
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      }
      
      return true;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'objectif",
        variant: "destructive"
      });
      console.error("Error deleting objective:", error);
      throw error;
    }
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
    
    // Objective operations
    addObjective,
    updateObjective,
    deleteObjective
  };
}
