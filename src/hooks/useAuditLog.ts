
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { auditService } from '@/services/auditService';
import { AuditAction, ResourceType } from '@/types/audit';

export function useAuditLog(defaultUserId?: string) {
  const [isLogging, setIsLogging] = useState(false);
  
  const logMutation = useMutation({
    mutationFn: async ({ action, resourceType, resourceId, details }: {
      action: AuditAction; 
      resourceType: ResourceType;
      resourceId: string;
      details?: Record<string, any>;
    }) => {
      return auditService.logAction(
        action,
        resourceType,
        resourceId,
        details
      );
    },
    onMutate: () => {
      setIsLogging(true);
    },
    onSettled: () => {
      setIsLogging(false);
    }
  });
  
  const logAction = async (
    action: AuditAction,
    resourceType: ResourceType,
    resourceId: string,
    details?: Record<string, any>
  ) => {
    try {
      return await logMutation.mutateAsync({
        action,
        resourceType,
        resourceId,
        details
      });
    } catch (error) {
      console.error('Failed to log audit action:', error);
      // We don't throw the error to avoid disrupting the main operation
      return null;
    }
  };
  
  return {
    logAction,
    isLogging
  };
}
