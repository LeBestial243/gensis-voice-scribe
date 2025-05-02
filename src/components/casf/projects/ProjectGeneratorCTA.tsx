
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProjectGeneratorCTAProps {
  profileId: string;
}

export function ProjectGeneratorCTA({ profileId }: ProjectGeneratorCTAProps) {
  const navigate = useNavigate();
  
  return (
    <Card className="border-dashed border-2">
      <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
        <div className="rounded-full bg-primary/10 p-3">
          <Target className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-medium text-lg mb-2">Assistant IA de création de projet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Utilisez notre assistant alimenté par l'IA pour générer automatiquement un projet éducatif personnalisé basé sur l'analyse des transcriptions et observations.
          </p>
        </div>
        <Button 
          onClick={() => navigate(`/young_profiles/${profileId}/generate-project`)}
          className="w-full"
        >
          Générer un projet avec l'IA
        </Button>
      </CardContent>
    </Card>
  );
}
