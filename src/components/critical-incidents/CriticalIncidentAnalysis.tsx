
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Check, Clock, X, FileText, Activity } from "lucide-react";
import { useIncidentAnalysis } from "@/hooks/useIncidentAnalysis";
import { CriticalIncident, BehavioralPattern } from "@/types/incidents";
import { IncidentDetails } from "./IncidentDetails";
import { PatternDetails } from "./PatternDetails";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CriticalIncidentAnalysisProps {
  profileId: string;
}

export function CriticalIncidentAnalysis({ profileId }: CriticalIncidentAnalysisProps) {
  const {
    incidents,
    patterns,
    isLoading,
    isError,
    selectedIncident,
    selectedPattern,
    selectIncident,
    selectPattern,
    updateIncidentStatus,
    refetchAnalysis
  } = useIncidentAnalysis(profileId);
  
  const [activeTab, setActiveTab] = useState<'incidents' | 'patterns'>('incidents');
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px]">
          <LoadingSpinner size="md" />
          <p className="mt-4 text-muted-foreground">Analyse des transcriptions en cours...</p>
        </CardContent>
      </Card>
    );
  }
  
  if (isError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Une erreur est survenue lors de l'analyse des transcriptions.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  const renderSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive">Haute</Badge>;
      case 'medium':
        return <Badge variant="default" className="bg-orange-500">Moyenne</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-blue-500 border-blue-500">Basse</Badge>;
      default:
        return <Badge variant="outline">Indéfinie</Badge>;
    }
  };
  
  const renderStatusBadge = (status: CriticalIncident['status']) => {
    switch (status) {
      case 'new':
        return <Badge variant="outline" className="bg-blue-500 text-white">Nouveau</Badge>;
      case 'acknowledged':
        return <Badge variant="outline" className="bg-amber-500 text-white">Reconnu</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="bg-green-500 text-white">Résolu</Badge>;
      default:
        return <Badge variant="outline">Indéfini</Badge>;
    }
  };
  
  return (
    <div className="incident-dashboard grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Analyse des incidents</CardTitle>
          <CardDescription>
            Incidents critiques et motifs comportementaux détectés à partir des transcriptions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'incidents' | 'patterns')}>
            <TabsList className="w-full">
              <TabsTrigger value="incidents" className="flex-1">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Incidents ({incidents.length})
              </TabsTrigger>
              <TabsTrigger value="patterns" className="flex-1">
                <Activity className="h-4 w-4 mr-2" />
                Motifs ({patterns.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="incidents" className="m-0">
              <ScrollArea className="h-[500px] p-4">
                {incidents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Aucun incident détecté</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {incidents.map(incident => (
                      <div
                        key={incident.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedIncident?.id === incident.id
                            ? 'bg-accent/50 border-primary/50'
                            : 'hover:bg-accent/30'
                        }`}
                        onClick={() => selectIncident(incident)}
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm">{incident.title}</h4>
                          {renderSeverityBadge(incident.severity)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {incident.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(incident.date).toLocaleDateString()}
                          </span>
                          {renderStatusBadge(incident.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="patterns" className="m-0">
              <ScrollArea className="h-[500px] p-4">
                {patterns.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <Activity className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Aucun motif comportemental détecté</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {patterns.map(pattern => (
                      <div
                        key={pattern.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedPattern?.id === pattern.id
                            ? 'bg-accent/50 border-primary/50'
                            : 'hover:bg-accent/30'
                        }`}
                        onClick={() => selectPattern(pattern)}
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm">{pattern.name}</h4>
                          {renderSeverityBadge(pattern.severity)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Occurrences: <strong>{pattern.occurrences}</strong>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {pattern.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Card className="md:col-span-2">
        {selectedIncident ? (
          <IncidentDetails 
            incident={selectedIncident} 
            updateStatus={updateIncidentStatus} 
            onClose={() => selectIncident(null)} 
          />
        ) : selectedPattern ? (
          <PatternDetails 
            pattern={selectedPattern} 
            incidents={incidents.filter(inc => 
              selectedPattern.relatedIncidents?.includes(inc.id)
            )} 
            onSelectIncident={selectIncident}
            onClose={() => selectPattern(null)} 
          />
        ) : (
          <CardContent className="flex flex-col items-center justify-center text-center p-8 h-full">
            <Activity className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">Analyse des incidents critiques</h3>
            <p className="text-muted-foreground mb-6">
              Sélectionnez un incident ou un motif comportemental pour voir les détails.
            </p>
            <Button onClick={() => refetchAnalysis()}>
              Rafraîchir l'analyse
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
