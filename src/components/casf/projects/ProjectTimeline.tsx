
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectObjective } from '@/types/projects';

interface ProjectTimelineProps {
  objectives: ProjectObjective[];
  startDate: string;
  endDate: string;
}

export function ProjectTimeline({ objectives, startDate, endDate }: ProjectTimelineProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  // Convert dates to timestamps for calculation
  const projectStart = new Date(startDate).getTime();
  const projectEnd = new Date(endDate).getTime();
  const projectDuration = projectEnd - projectStart;
  
  // Sort objectives by target date
  const sortedObjectives = [...objectives].sort((a, b) => {
    return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Chronologie du projet</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Project timeline */}
          <div className="flex justify-between mb-2 text-sm text-muted-foreground">
            <span>{formatDate(startDate)}</span>
            <span>{formatDate(endDate)}</span>
          </div>
          <div className="h-2 bg-muted rounded-full mb-8"></div>
          
          {/* Objectives on timeline */}
          <div className="space-y-8">
            {sortedObjectives.map((objective, index) => {
              // Calculate position on timeline as percentage
              const objectiveDate = new Date(objective.target_date).getTime();
              const position = ((objectiveDate - projectStart) / projectDuration) * 100;
              const clampedPosition = Math.max(0, Math.min(100, position));
              
              // Get color based on status
              const getStatusColor = () => {
                switch (objective.status) {
                  case 'completed':
                    return 'bg-green-500';
                  case 'in_progress':
                    return 'bg-amber-500';
                  case 'cancelled':
                    return 'bg-red-500';
                  default:
                    return 'bg-blue-500';
                }
              };
              
              return (
                <div key={objective.id} className="relative">
                  {/* Dot on timeline */}
                  <div 
                    className="absolute top-0 w-4 h-4 rounded-full border-2 border-background"
                    style={{ 
                      left: `calc(${clampedPosition}% - 8px)`,
                      top: '-58px', // Position dot on the timeline
                      backgroundColor: getStatusColor().replace('bg-', '') // Extract color without bg- prefix
                    }}
                  ></div>
                  
                  {/* Content with offset to align with dot */}
                  <div 
                    className="ml-6 p-4 bg-accent/10 rounded-lg"
                    style={{ marginLeft: `${clampedPosition}%` }}
                  >
                    <h4 className="font-medium">{objective.title}</h4>
                    <div className="text-xs text-muted-foreground mt-1">
                      Échéance: {formatDate(objective.target_date)}
                    </div>
                    {objective.description && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {objective.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Empty state */}
          {sortedObjectives.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun objectif défini pour ce projet. Ajoutez des objectifs pour voir la chronologie.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
