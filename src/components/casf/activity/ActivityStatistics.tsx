
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AuditLog, AuditAction } from '@/types/audit';

interface ActionCount {
  action: string;
  count: number;
  actionLabel: string;
}

interface ActivityStatisticsProps {
  logs: AuditLog[];
  title?: string;
  height?: number;
}

export function ActivityStatistics({ 
  logs, 
  title = "Statistiques d'activité",
  height = 300
}: ActivityStatisticsProps) {
  // Process logs to get action counts
  const actionCounts = React.useMemo(() => {
    const actions = ['create', 'read', 'update', 'delete', 'download', 'upload'];
    const actionLabels: Record<string, string> = {
      create: 'Création',
      read: 'Lecture',
      update: 'Mise à jour',
      delete: 'Suppression',
      download: 'Téléchargement',
      upload: 'Envoi'
    };
    
    const counts: Record<string, number> = {};
    
    // Initialize counts for all actions
    actions.forEach(action => {
      counts[action] = 0;
    });
    
    // Count occurrences of each action
    logs.forEach(log => {
      if (actions.includes(log.action)) {
        counts[log.action]++;
      }
    });
    
    // Convert counts to array for chart
    return Object.entries(counts)
      .map(([action, count]) => ({
        action,
        count,
        actionLabel: actionLabels[action] || action
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
  }, [logs]);
  
  const getBarColor = (actionType: string): string => {
    switch (actionType) {
      case 'create': return '#22c55e'; // green
      case 'read': return '#3b82f6'; // blue
      case 'update': return '#f97316'; // orange
      case 'delete': return '#ef4444'; // red
      case 'download': return '#a855f7'; // purple
      case 'upload': return '#06b6d4'; // cyan
      default: return '#94a3b8'; // gray
    }
  };
  
  if (!logs.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground">Aucune donnée disponible</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={actionCounts}
            margin={{
              top: 20,
              right: 30,
              left: 5,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="actionLabel" />
            <YAxis allowDecimals={false} />
            <Tooltip 
              formatter={(value: number) => [`${value} actions`, 'Nombre']}
              labelFormatter={(value: string) => `Type: ${value}`}
            />
            <Bar 
              dataKey="count" 
              name="Nombre d'actions" 
              fill="#8884d8" 
              radius={[4, 4, 0, 0]}
              barSize={40}
            >
              {actionCounts.map((entry, index) => (
                <Bar 
                  key={`bar-${index}`} 
                  dataKey="count"
                  fill={getBarColor(entry.action)} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
