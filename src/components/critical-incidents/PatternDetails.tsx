
import { CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, X, AlertTriangle } from "lucide-react";
import { BehavioralPattern, CriticalIncident } from "@/types/incidents";

interface PatternDetailsProps {
  pattern: BehavioralPattern;
  incidents: CriticalIncident[];
  onSelectIncident: (incident: CriticalIncident) => void;
  onClose: () => void;
}

export function PatternDetails({ 
  pattern, 
  incidents, 
  onSelectIncident, 
  onClose 
}: PatternDetailsProps) {
  const getSeverityBadge = () => {
    switch (pattern.severity) {
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
  
  return (
    <>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            <CardTitle>{pattern.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {getSeverityBadge()}
            <Badge variant="outline" className="bg-blue-100">
              {pattern.occurrences} occurrences
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-1">Description</h4>
          <p className="text-sm text-muted-foreground">
            {pattern.description}
          </p>
        </div>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-1">Analyse</h4>
          <p className="text-sm text-muted-foreground">
            {pattern.occurrences > 5
              ? 'Ce motif comportemental apparaît régulièrement et mérite une attention particulière.'
              : pattern.occurrences > 2
              ? 'Ce motif comportemental est présent mais ne semble pas dominant.'
              : 'Ce motif comportemental n\'est pas fréquent mais mérite d\'être surveillé.'
            }
          </p>
        </div>
        
        <div className="mb-2">
          <h4 className="text-sm font-medium mb-1">Incidents associés ({incidents.length})</h4>
          <div className="space-y-2 mt-2">
            {incidents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun incident associé</p>
            ) : (
              incidents.map(incident => (
                <div
                  key={incident.id}
                  className="p-3 border rounded-md cursor-pointer hover:bg-accent/30 transition-colors"
                  onClick={() => onSelectIncident(incident)}
                >
                  <div className="flex items-start justify-between">
                    <h5 className="text-sm font-medium">{incident.title}</h5>
                    <Badge
                      variant={incident.severity === 'high' ? 'destructive' : 'outline'}
                      className={incident.severity === 'medium' ? 'bg-orange-500 text-white' : ''}
                    >
                      {incident.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {incident.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" onClick={onClose}>
          Retour
        </Button>
      </CardFooter>
    </>
  );
}
