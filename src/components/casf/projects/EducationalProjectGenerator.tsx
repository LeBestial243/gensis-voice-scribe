
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { projectGenerationService, ProjectRecommendation } from '@/services/projectGenerationService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useEducationalProject } from '@/hooks/useEducationalProject';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, AlertCircle, ThumbsUp, ThumbsDown, Target } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectStatus } from '@/types/casf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EducationalProjectGeneratorProps {
  profileId: string;
  onProjectCreated?: (projectId: string) => void;
}

export function EducationalProjectGenerator({ profileId, onProjectCreated }: EducationalProjectGeneratorProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [recommendation, setRecommendation] = useState<ProjectRecommendation | null>(null);
  const [activeTab, setActiveTab] = useState('analysis');
  
  const { createProject } = useEducationalProject({ profileId });
  
  const generateRecommendations = async () => {
    setIsGenerating(true);
    
    try {
      const result = await projectGenerationService.generateProjectRecommendations(profileId);
      setRecommendation(result);
      setActiveTab('project');
      
      toast({
        title: "Recommandations générées",
        description: "Un projet éducatif personnalisé a été généré à partir des données disponibles.",
      });
    } catch (error) {
      console.error("Error generating project recommendations:", error);
      toast({
        title: "Erreur lors de la génération",
        description: "Impossible de générer des recommandations. Veuillez réessayer plus tard.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleCreateProject = async (userId: string) => {
    if (!recommendation) return;
    
    try {
      const newProject = await createProject({
        profile_id: profileId,
        title: recommendation.title,
        objectives: recommendation.objectives,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months from now
        status: 'planned' as ProjectStatus,
      }, userId);
      
      toast({
        title: "Projet créé avec succès",
        description: "Le projet éducatif a été créé. Vous pouvez maintenant y ajouter des objectifs spécifiques.",
      });
      
      if (onProjectCreated) {
        onProjectCreated(newProject.id);
      }
      
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Erreur lors de la création du projet",
        description: "Impossible de créer le projet. Veuillez réessayer plus tard.",
        variant: "destructive"
      });
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMMM yyyy', { locale: fr });
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <div className="space-y-6">
      {!recommendation && (
        <Card>
          <CardHeader>
            <CardTitle>Générateur de projet éducatif</CardTitle>
            <CardDescription>
              Générer automatiquement un projet éducatif personnalisé basé sur l'analyse des transcriptions et observations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Le générateur de projet analysera toutes les transcriptions et incidents critiques enregistrés pour proposer :
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-muted/50 p-4 rounded-lg flex flex-col items-center text-center">
                <Target className="h-10 w-10 text-primary mb-2" />
                <h3 className="font-medium">Objectifs personnalisés</h3>
                <p className="text-sm text-muted-foreground">Basés sur les besoins identifiés</p>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg flex flex-col items-center text-center">
                <ThumbsUp className="h-10 w-10 text-green-500 mb-2" />
                <h3 className="font-medium">Points forts</h3>
                <p className="text-sm text-muted-foreground">Pour s'appuyer sur les acquis</p>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg flex flex-col items-center text-center">
                <ThumbsDown className="h-10 w-10 text-amber-500 mb-2" />
                <h3 className="font-medium">Axes d'amélioration</h3>
                <p className="text-sm text-muted-foreground">Pour cibler les interventions</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={generateRecommendations} 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                'Générer un projet personnalisé'
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {recommendation && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">{recommendation.title}</h2>
            <Button variant="outline" onClick={() => setRecommendation(null)}>
              Générer un nouveau projet
            </Button>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="analysis">Analyse</TabsTrigger>
              <TabsTrigger value="project">Proposition de projet</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analysis" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Points forts identifiés</CardTitle>
                  <CardDescription>Compétences et qualités observées</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-2">
                    {recommendation.strengths.map((strength, index) => (
                      <li key={`strength-${index}`} className="text-green-600">{strength}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Axes d'amélioration</CardTitle>
                  <CardDescription>Domaines nécessitant une attention particulière</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-2">
                    {recommendation.areasForImprovement.map((area, index) => (
                      <li key={`area-${index}`} className="text-amber-600">{area}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recommandations</CardTitle>
                  <CardDescription>Suggestions d'approches éducatives</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-2">
                    {recommendation.recommendations.map((rec, index) => (
                      <li key={`rec-${index}`}>{rec}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="project" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Projet éducatif personnalisé</CardTitle>
                  <CardDescription>Description générale et objectifs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Titre du projet</h4>
                      <p>{recommendation.title}</p>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Objectifs généraux</h4>
                      <p>{recommendation.objectives}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Objectifs proposés</CardTitle>
                  <CardDescription>Objectifs SMART suggérés pour ce projet</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {recommendation.suggestedGoals.map((goal, index) => (
                      <div key={`goal-${index}`} className="bg-muted/50 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">{goal.title}</h4>
                          <Badge 
                            className={
                              goal.priority === 'high' ? 'bg-red-100 text-red-800 hover:bg-red-100' :
                              goal.priority === 'medium' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' :
                              'bg-green-100 text-green-800 hover:bg-green-100'
                            }
                          >
                            Priorité {
                              goal.priority === 'high' ? 'haute' :
                              goal.priority === 'medium' ? 'moyenne' :
                              'basse'
                            }
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm">{goal.description}</p>
                        <div className="mt-3 text-xs text-muted-foreground">
                          Date cible: {formatDate(goal.targetDate)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <p className="text-sm text-muted-foreground w-full">
                    Cliquez ci-dessous pour créer un nouveau projet avec ces recommandations. 
                    Vous pourrez ensuite ajouter manuellement les objectifs suggérés et les personnaliser.
                  </p>
                  <Button 
                    className="w-full"
                    onClick={() => handleCreateProject('user-id')} // In production, use the actual user ID
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Créer ce projet éducatif
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
