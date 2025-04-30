
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { confidentialityService } from "@/services/confidentialityService";
import { ConfidentialityLevel, ConfidentialitySettings, AuditLogEntry } from "@/types/casf";
import { useErrorHandler } from "@/utils/errorHandler";
import { useToast } from "@/hooks/use-toast";

// Define the resource types that can have confidentiality levels
type ResourceWithConfidentiality = 'files' | 'notes';

export function useConfidentiality(userId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();
  
  // Get the current user's role
  const [userRole, setUserRole] = useState<string>("user");
  
  // Fetch confidentiality settings
  const { 
    data: settings,
    isLoading: isLoadingSettings,
    error: settingsError
  } = useQuery({
    queryKey: ['confidentiality_settings'],
    queryFn: () => confidentialityService.getSettings(),
    meta: {
      onError: (error: any) => handleError(error, "Récupération des paramètres de confidentialité")
    }
  });
  
  // Mutation to update confidentiality settings
  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: ConfidentialitySettings) => 
      confidentialityService.updateSettings(newSettings, userId || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['confidentiality_settings'] });
      toast({
        title: "Paramètres mis à jour",
        description: "Les paramètres de confidentialité ont été mis à jour avec succès."
      });
    },
    onError: (error) => handleError(error, "Mise à jour des paramètres de confidentialité")
  });
  
  // Check if a user can access a resource
  const checkAccess = async (
    resourceType: string,
    resourceId: string,
    requiredAccess: 'read' | 'write'
  ) => {
    try {
      if (!userId) return false;
      return await confidentialityService.canUserAccess(
        userId,
        resourceType,
        resourceId,
        requiredAccess
      );
    } catch (error) {
      handleError(error, "Vérification de l'accès", false);
      return false;
    }
  };
  
  // Get audit logs
  const getAuditLogs = async (
    filters: {
      userId?: string;
      resourceType?: string;
      resourceId?: string;
      action?: string;
      startDate?: string;
      endDate?: string;
    },
    pagination: { page: number; pageSize: number }
  ) => {
    try {
      return await confidentialityService.getAuditLogs(filters, pagination);
    } catch (error) {
      handleError(error, "Récupération des logs d'audit");
      return { logs: [], total: 0 };
    }
  };
  
  // Set confidentiality level for a resource
  const setResourceConfidentiality = async (
    resourceType: ResourceWithConfidentiality,
    resourceId: string,
    level: ConfidentialityLevel
  ) => {
    try {
      if (!userId) return false;
      await confidentialityService.setResourceConfidentiality(
        resourceType,
        resourceId,
        level,
        userId
      );
      
      // Invalidate potentially affected queries
      queryClient.invalidateQueries({ queryKey: [resourceType, resourceId] });
      
      toast({
        title: "Niveau de confidentialité mis à jour",
        description: `Le niveau de confidentialité a été défini sur "${level}".`
      });
      
      return true;
    } catch (error) {
      handleError(error, "Modification du niveau de confidentialité");
      return false;
    }
  };
  
  // Check if the current user can access content with the specified confidentiality level
  const canAccess = async (
    level: ConfidentialityLevel, 
    action: 'view' | 'edit' = 'view'
  ): Promise<boolean> => {
    try {
      return await confidentialityService.canAccess(level, action);
    } catch (error) {
      handleError(error, "Vérification du niveau d'accès", false);
      return false;
    }
  };
  
  // Function to update default confidentiality level for a resource type
  const updateDefaultLevel = (resourceType: string, level: ConfidentialityLevel) => {
    if (!settings) return;
    
    const newSettings: ConfidentialitySettings = {
      ...settings,
      defaultLevels: {
        ...settings.defaultLevels,
        [resourceType]: level
      }
    };
    
    updateSettingsMutation.mutate(newSettings);
  };
  
  return {
    // Data
    settings,
    userRole,
    
    // States
    isLoading: isLoadingSettings,
    isLoadingSettings,
    isUpdatingSettings: updateSettingsMutation.isPending,
    
    // Actions
    updateSettings: (newSettings: ConfidentialitySettings) => 
      updateSettingsMutation.mutate(newSettings),
    checkAccess,
    getAuditLogs,
    setResourceConfidentiality,
    canAccess,
    updateDefaultLevel,
    
    // Utilities
    getDefaultLevelForResource: (resourceType: string): ConfidentialityLevel => 
      settings?.defaultLevels[resourceType] || 'public'
  };
}
