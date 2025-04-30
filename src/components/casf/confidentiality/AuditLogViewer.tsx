
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AuditLog, AuditAction, ResourceType } from '@/types/audit';
import { auditService } from '@/services/auditService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePagination } from '@/hooks/usePagination';
import { CustomPagination } from '@/components/CustomPagination';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, FileText, User, Folder, Calendar, Activity } from 'lucide-react';

interface AuditLogViewerProps {
  resourceId?: string;
  resourceType?: ResourceType;
  userId?: string;
  maxItems?: number;
}

export function AuditLogViewer({
  resourceId,
  resourceType,
  userId,
  maxItems = 20
}: AuditLogViewerProps) {
  const [actionFilter, setActionFilter] = useState<AuditAction | 'all'>('all');
  
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', resourceId, resourceType, userId, actionFilter],
    queryFn: () => auditService.getAuditLogs({
      resourceId,
      resourceType,
      userId,
      action: actionFilter !== 'all' ? actionFilter : undefined
    }),
  });
  
  const {
    paginatedItems: paginatedLogs,
    currentPage,
    setCurrentPage,
    totalPages
  } = usePagination({
    items: logs,
    pageSize: maxItems,
    initialPage: 1
  });

  // Helper function to get icon for resource type
  const getResourceIcon = (type?: string) => {
    switch(type) {
      case 'file': return <FileText className="h-4 w-4" />;
      case 'folder': return <Folder className="h-4 w-4" />;
      case 'project': return <Activity className="h-4 w-4" />;
      case 'profile': return <User className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  // Helper function to format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR');
  };

  const getActionColor = (action: string) => {
    switch(action) {
      case 'create': return 'text-green-500';
      case 'update': return 'text-blue-500';
      case 'delete': return 'text-red-500';
      case 'read': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Journal d'activité</span>
          <Select value={actionFilter} onValueChange={(value: AuditAction | 'all') => setActionFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrer par action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les actions</SelectItem>
              <SelectItem value="create">Création</SelectItem>
              <SelectItem value="read">Lecture</SelectItem>
              <SelectItem value="update">Mise à jour</SelectItem>
              <SelectItem value="delete">Suppression</SelectItem>
              <SelectItem value="download">Téléchargement</SelectItem>
              <SelectItem value="upload">Envoi</SelectItem>
            </SelectContent>
          </Select>
        </CardTitle>
        <CardDescription>
          {resourceId ? 'Historique des actions sur cette ressource' : 'Historique des actions récentes'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {paginatedLogs.length > 0 ? paginatedLogs.map((log) => (
              <div key={log.id} className="flex gap-4 p-3 border rounded-md">
                <div className="bg-muted rounded-full p-2">
                  {getResourceIcon(log.resource_type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className={`font-medium ${getActionColor(log.action)}`}>
                      {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                  
                  <div className="text-sm mt-1">
                    {log.resource_type.charAt(0).toUpperCase() + log.resource_type.slice(1)}
                    {log.details && log.details.name && `: ${log.details.name}`}
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                Aucune entrée dans le journal d'activité
              </div>
            )}
          </div>
        </ScrollArea>
        
        {totalPages > 1 && (
          <CustomPagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            className="mt-4"
          />
        )}
      </CardContent>
    </Card>
  );
}
