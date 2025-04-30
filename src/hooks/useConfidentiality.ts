
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { confidentialityService } from "@/services/confidentialityService";
import { ConfidentialityLevel, ConfidentialitySettings, AuditLogEntry } from "@/types/casf";
import { useErrorHandler } from "@/utils/errorHandler";
import { useToast } from "@/hooks/use-toast";

// Define the resource types that can have confidentiality levels
type ResourceWithConfidentiality = 'files' | 'notes';

export function useConfidentiality(userId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();
  
  // Récupérer les paramètres de confidentialité
  const { 
    data: settings,
    isLoading: isLoadingSettings,
    error: settingsError
  } = useQuery({
    queryKey: ['confidentiality_settings'],
    queryFn: () => confidentialityService.getSettings(),
    onError: (error) => handleError(error, "Récupération des paramètres de confidentialité")
  });
  
  // Mutation pour mettre à jour les paramètres
  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: ConfidentialitySettings) => 
      confidentialityService.updateSettings(newSettings, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['confidentiality_settings'] });
      toast({
        title: "Paramètres mis à jour",
        description: "Les paramètres de confidentialité ont été mis à jour avec succès."
      });
    },
    onError: (error) => handleError(error, "Mise à jour des paramètres de confidentialité")
  });
  
  // Vérifier si un utilisateur peut accéder à une ressource
  const checkAccess = async (
    resourceType: string,
    resourceId: string,
    requiredAccess: 'read' | 'write'
  ) => {
    try {
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
  
  // Récupérer les logs d'audit
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
  
  // Définir le niveau de confidentialité d'une ressource
  const setResourceConfidentiality = async (
    resourceType: ResourceWithConfidentiality,
    resourceId: string,
    level: ConfidentialityLevel
  ) => {
    try {
      await confidentialityService.setResourceConfidentiality(
        resourceType,
        resourceId,
        level,
        userId
      );
      
      // Invalider les requêtes potentiellement affectées
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
  
  // Vérifier si un niveau de confidentialité est accessible
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
  
  return {
    // Données
    settings,
    
    // États
    isLoadingSettings,
    isUpdatingSettings: updateSettingsMutation.isPending,
    
    // Actions
    updateSettings: (newSettings: ConfidentialitySettings) => 
      updateSettingsMutation.mutate(newSettings),
    checkAccess,
    getAuditLogs,
    setResourceConfidentiality,
    canAccess,
    
    // Utilitaires
    getDefaultLevelForResource: (resourceType: string): ConfidentialityLevel => 
      settings?.defaultLevels[resourceType] || 'public'
  };
}
