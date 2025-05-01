
import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectObjective, ObjectiveStatus } from "@/types/casf";
import { Plus, Check, Clock, AlertTriangle, Target, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ObjectiveFormDialog } from "./ObjectiveFormDialog";
import { format, formatDistance } from "date-fns";
import { fr } from "date-fns/locale";

interface ObjectivesListProps {
  projectId: string;
  objectives: ProjectObjective[];
  isLoading: boolean;
  onCreateObjective: () => void;
  onUpdateStatus: (objectiveId: string, status: ObjectiveStatus) => void;
  onUpdateProgress: (objectiveId: string, progress: number) => void;
  onSelectObjective: (objectiveId: string) => void;
}

export function ObjectivesList({
  projectId,
  objectives,
  isLoading,
  onCreateObjective,
  onUpdateStatus,
  onUpdateProgress,
  onSelectObjective
}: ObjectivesListProps) {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Filtrer les objectifs selon l'onglet actif
  const filteredObjectives = objectives.filter(objective => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return objective.status === "pending";
    if (activeTab === "in_progress") return objective.status === "in_progress";
    if (activeTab === "achieved") return objective.status === "achieved";
    return true;
  });
  
  // Trier les objectifs par date cible
  const sortedObjectives = [...filteredObjectives].sort((a, b) => {
    return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
  });
  
  const getStatusIcon = (status: ObjectiveStatus) => {
    switch (status) {
      case "pending": return <Target className="h-4 w-4 text-blue-500" />;
      case "in_progress": return <Clock className="h-4 w-4 text-amber-500" />;
      case "achieved": return <Check className="h-4 w-4 text-green-500" />;
      case "canceled": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Target className="h-4 w-4 text-blue-500" />;
    }
  };
  
  const getStatusBadge = (status: ObjectiveStatus) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">À faire</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700">En cours</Badge>;
      case "achieved":
        return <Badge variant="outline" className="bg-green-50 text-green-700">Atteint</Badge>;
      case "canceled":
        return <Badge variant="outline" className="bg-red-50 text-red-700">Annulé</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };
  
  const calculateDaysRemaining = (targetDate: string) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Objectifs spécifiques</CardTitle>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un objectif
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">
                Tous
                <Badge variant="outline" className="ml-2">{objectives.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="pending">
                À faire
                <Badge variant="outline" className="ml-2">
                  {objectives.filter(o => o.status === "pending").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="in_progress">
                En cours
                <Badge variant="outline" className="ml-2">
                  {objectives.filter(o => o.status === "in_progress").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="achieved">
                Atteints
                <Badge variant="outline" className="ml-2">
                  {objectives.filter(o => o.status === "achieved").length}
                </Badge>
              </TabsTrigger>
            </TabsList>
            
            <div className="space-y-4">
              {sortedObjectives.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Target className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">Aucun objectif {activeTab !== "all" ? "dans cette catégorie" : ""}</p>
                  <Button variant="link" size="sm" onClick={() => setIsDialogOpen(true)}>
                    Ajouter un objectif
                  </Button>
                </div>
              ) : (
                sortedObjectives.map((objective) => {
                  const daysRemaining = calculateDaysRemaining(objective.target_date);
                  const isOverdue = daysRemaining < 0 && objective.status !== "achieved" && objective.status !== "canceled";
                  
                  return (
                    <div
                      key={objective.id}
                      className={`
                        p-4 border rounded-lg transition-all duration-200 hover:shadow-sm
                        ${isOverdue ? 'border-red-200 bg-red-50/50' : 'border-gray-200'}
                      `}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <div className={`
                            p-2 rounded-full flex-shrink-0 mt-1
                            ${objective.status === 'achieved' ? 'bg-green-100' :
                              objective.status === 'in_progress' ? 'bg-amber-100' :
                              objective.status === 'canceled' ? 'bg-red-100' :
                              'bg-blue-100'}
                          `}>
                            {getStatusIcon(objective.status)}
                          </div>
                          <div>
                            <h3 className="font-medium" onClick={() => onSelectObjective(objective.id)}>
                              {objective.title}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">{objective.description}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {getStatusBadge(objective.status)}
                          <span className="text-xs text-gray-500">
                            {objective.status === "achieved" ? (
                              "Objectif atteint"
                            ) : isOverdue ? (
                              <span className="text-red-600 font-medium">
                                En retard de {Math.abs(daysRemaining)} jour{Math.abs(daysRemaining) > 1 ? 's' : ''}
                              </span>
                            ) : (
                              <>
                                Échéance: {format(new Date(objective.target_date), 'PPP', { locale: fr })}
                                <span className="ml-1 text-xs">
                                  ({daysRemaining} jour{daysRemaining > 1 ? 's' : ''})
                                </span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium">Progression: {objective.progress}%</span>
                        </div>
                        <Progress 
                          value={objective.progress} 
                          className={`
                            ${objective.status === 'achieved' ? 'bg-green-100' :
                              objective.status === 'in_progress' ? 'bg-amber-100' :
                              objective.status === 'canceled' ? 'bg-red-100' :
                              'bg-blue-100'}
                          `}
                        />
                      </div>
                      
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onSelectObjective(objective.id)}
                          >
                            Détails
                          </Button>
                          
                          {objective.status !== "achieved" && objective.status !== "canceled" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => onUpdateStatus(objective.id, "achieved")}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Marquer comme atteint
                            </Button>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {objective.status === "pending" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => onUpdateStatus(objective.id, "in_progress")}
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              Démarrer
                            </Button>
                          )}
                          
                          {objective.status === "in_progress" && (
                            <select
                              className="p-1 text-xs border rounded-md"
                              value={objective.progress}
                              onChange={(e) => onUpdateProgress(objective.id, parseInt(e.target.value))}
                            >
                              {Array.from({ length: 11 }, (_, i) => i * 10).map((value) => (
                                <option key={value} value={value}>{value}%</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
      
      <ObjectiveFormDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={() => {
          onCreateObjective();
          setIsDialogOpen(false);
        }}
        projectId={projectId}
      />
    </>
  );
}
