import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectEventLog, ProjectObjective } from "@/types/casf";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Check, Clock, Target, AlertTriangle, Pencil, Plus, FileText } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// Support both the original timeline (objectives-based) and the new event log timeline
interface ProjectTimelineProps {
  objectives?: ProjectObjective[];
  startDate?: string;
  endDate?: string;
  events?: ProjectEventLog[];
  isLoading?: boolean;
}

export function ProjectTimeline({ 
  objectives, 
  startDate, 
  endDate,
  events = [],
  isLoading = false
}: ProjectTimelineProps) {
  // Handle loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historique du projet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <LoadingSpinner size="sm" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // If we have objectives, startDate, and endDate, render the original timeline
  if (objectives && startDate && endDate) {
    return renderObjectivesTimeline(objectives, startDate, endDate);
  }
  
  // Otherwise render the event log timeline
  return renderEventsTimeline(events);
}

// Original implementation for objectives-based timeline
function renderObjectivesTimeline(objectives: ProjectObjective[], startDate: string, endDate: string) {
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

// New implementation for event-based timeline
function renderEventsTimeline(events: ProjectEventLog[]) {
  const getEventIcon = (event: ProjectEventLog) => {
    switch (event.event_type) {
      case "creation":
        return <Plus className="h-4 w-4 text-green-500" />;
      case "update":
        return <Pencil className="h-4 w-4 text-blue-500" />;
      case "status_change":
        const newStatus = event.metadata?.new_status;
        if (newStatus === "achieved") return <Check className="h-4 w-4 text-green-500" />;
        if (newStatus === "in_progress") return <Clock className="h-4 w-4 text-amber-500" />;
        if (newStatus === "canceled") return <AlertTriangle className="h-4 w-4 text-red-500" />;
        return <Target className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique du projet</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Aucun événement dans l'historique</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute top-0 bottom-0 left-5 w-0.5 bg-gray-200"></div>
            
            <div className="space-y-6">
              {events.map((event) => (
                <div key={event.id} className="relative pl-10">
                  <div className="absolute left-0 top-1 p-2 rounded-full bg-white shadow-sm border">
                    {getEventIcon(event)}
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">
                      {event.content}
                    </p>
                    
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-xs text-gray-500">
                        {format(new Date(event.created_at), 'PPP à HH:mm', { locale: fr })}
                      </div>
                      {event.created_by && (
                        <div className="text-xs text-gray-500">
                          par {event.created_by}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
