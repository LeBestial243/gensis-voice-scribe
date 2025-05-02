
import { CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Clock, X, FileText } from "lucide-react";
import { CriticalIncident } from "@/types/incidents";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface IncidentDetailsProps {
  incident: CriticalIncident;
  updateStatus: (id: string, status: CriticalIncident['status']) => void;
  onClose: () => void;
}

export function IncidentDetails({ incident, updateStatus, onClose }: IncidentDetailsProps) {
  const getTypeIcon = () => {
    switch (incident.type) {
      case 'conflict':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'distress':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'health':
        return <AlertTriangle className="h-5 w-5 text-purple-500" />;
      case 'achievement':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'regression':
        return <Clock className="h-5 w-5 text-amber-500" />;
      default:
        return <FileText className="h-5 w-5 text-blue-500" />;
    }
  };
  
  const getSeverityLabel = () => {
    switch (incident.severity) {
      case 'high':
        return <Badge variant="destructive">Haute sévérité</Badge>;
      case 'medium':
        return <Badge className="bg-orange-500">Sévérité moyenne</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-blue-500 border-blue-500">Sévérité basse</Badge>;
      default:
        return <Badge variant="outline">Sévérité indéterminée</Badge>;
    }
  };
  
  const getStatusActions = () => {
    switch (incident.status) {
      case 'new':
        return (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => updateStatus(incident.id, 'acknowledged')}
            >
              Marquer comme reconnu
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => updateStatus(incident.id, 'resolved')}
            >
              Marquer comme résolu
            </Button>
          </div>
        );
      case 'acknowledged':
        return (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => updateStatus(incident.id, 'resolved')}
            >
              Marquer comme résolu
            </Button>
          </div>
        );
      case 'resolved':
        return (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => updateStatus(incident.id, 'new')}
            >
              Rouvrir
            </Button>
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            {getTypeIcon()}
            <CardTitle>{incident.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {getSeverityLabel()}
            <Badge variant="outline" className={
              incident.status === 'new' ? 'bg-blue-500 text-white' :
              incident.status === 'acknowledged' ? 'bg-amber-500 text-white' :
              'bg-green-500 text-white'
            }>
              {incident.status === 'new' ? 'Nouveau' : 
               incident.status === 'acknowledged' ? 'Reconnu' : 'Résolu'}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-1">Date de détection</h4>
          <p className="text-sm text-muted-foreground">
            {format(new Date(incident.date), 'PPP à HH:mm', { locale: fr })}
          </p>
        </div>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-1">Type</h4>
          <p className="text-sm text-muted-foreground">
            {incident.type === 'conflict' && 'Conflit interpersonnel'}
            {incident.type === 'distress' && 'Signe de détresse'}
            {incident.type === 'health' && 'Problème de santé'}
            {incident.type === 'achievement' && 'Réussite notable'}
            {incident.type === 'regression' && 'Signe de régression'}
            {incident.type === 'other' && 'Autre incident'}
          </p>
        </div>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-1">Description</h4>
          <p className="text-sm text-muted-foreground">
            {incident.description}
          </p>
        </div>
        
        {incident.transcriptionId && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-1">Source</h4>
            <p className="text-sm text-muted-foreground">
              Transcription #{incident.transcriptionId.substring(0, 8)}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {getStatusActions()}
      </CardFooter>
    </>
  );
}
