
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectObjective, ObjectiveStatus } from '@/types/projects';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Clock, AlertCircle, XCircle, CalendarDays } from 'lucide-react';

interface ProjectTimelineProps {
  objectives: ProjectObjective[];
  startDate: string;
  endDate: string;
}

export function ProjectTimeline({ objectives, startDate, endDate }: ProjectTimelineProps) {
  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };
  
  // Helper function to get status icon
  const getStatusIcon = (status: ObjectiveStatus | string) => {
    switch (status) {
      case 'not_started':
        return <Clock className="h-5 w-5 text-gray-400" />;
      case 'in_progress':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };
  
  // Helper function to get status text
  const getStatusText = (status: ObjectiveStatus | string) => {
    switch (status) {
      case 'not_started': return 'Non commencé';
      case 'in_progress': return 'En cours';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };
  
  // Sort objectives by target date
  const sortedObjectives = [...objectives].sort((a, b) => 
    new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
  );
  
  // Function to get node color class based on status
  const getNodeColorClass = (status: ObjectiveStatus | string) => {
    switch (status) {
      case 'not_started': return 'bg-gray-200';
      case 'in_progress': return 'bg-amber-200';
      case 'completed': return 'bg-green-200';
      case 'cancelled': return 'bg-red-200';
      default: return 'bg-gray-200';
    }
  };
  
  // Function to check if an objective is overdue
  const isOverdue = (targetDate: string, status: ObjectiveStatus | string) => {
    return (
      status !== 'completed' && 
      status !== 'cancelled' && 
      new Date(targetDate) < new Date()
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chronologie du projet</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-6">
          <CalendarDays className="h-5 w-5 mr-2 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {formatDate(startDate)} - {formatDate(endDate)}
          </span>
        </div>
        
        {sortedObjectives.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun objectif défini pour ce projet
          </div>
        ) : (
          <div className="relative pl-8">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200"></div>
            
            {/* Project start */}
            <div className="relative flex items-center mb-6">
              <div className="absolute -left-8 w-4 h-4 rounded-full bg-primary border-4 border-background"></div>
              <div className="ml-4">
                <p className="font-medium">Début du projet</p>
                <p className="text-sm text-muted-foreground">{formatDate(startDate)}</p>
              </div>
            </div>

            {/* Objectives */}
            {sortedObjectives.map((objective, index) => (
              <div key={objective.id} className="relative mb-6">
                <div className={`absolute -left-8 w-4 h-4 rounded-full ${getNodeColorClass(objective.status)} border-4 border-background`}></div>
                <div className="ml-4">
                  <div className="flex items-center">
                    {getStatusIcon(objective.status)}
                    <p className="font-medium ml-2">{objective.title}</p>
                  </div>
                  <div className="flex items-center mt-1 text-sm">
                    <span className="text-muted-foreground">Cible: {formatDate(objective.target_date)}</span>
                    {isOverdue(objective.target_date, objective.status) && (
                      <span className="ml-2 text-red-500">En retard</span>
                    )}
                  </div>
                  <p className="text-sm mt-1">{getStatusText(objective.status)}</p>
                  {objective.description && (
                    <p className="text-sm text-muted-foreground mt-1">{objective.description}</p>
                  )}
                </div>
                
                {index < sortedObjectives.length - 1 && (
                  <Separator className="my-4 opacity-50" />
                )}
              </div>
            ))}
            
            {/* Project end */}
            <div className="relative flex items-center">
              <div className="absolute -left-8 w-4 h-4 rounded-full bg-primary border-4 border-background"></div>
              <div className="ml-4">
                <p className="font-medium">Fin prévue du projet</p>
                <p className="text-sm text-muted-foreground">{formatDate(endDate)}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
