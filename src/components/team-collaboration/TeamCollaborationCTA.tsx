
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TeamCollaborationCTAProps {
  profileId: string;
}

export function TeamCollaborationCTA({ profileId }: TeamCollaborationCTAProps) {
  const navigate = useNavigate();
  
  return (
    <Card className="border-dashed border-2">
      <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
        <div className="rounded-full bg-primary/10 p-3">
          <MessageSquare className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-medium text-lg mb-2">Espace de collaboration</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Collaborez en temps réel avec les membres de l'équipe éducative. Partagez des observations, commentez et coordonnez vos actions.
          </p>
        </div>
        <Button 
          onClick={() => navigate(`/young-profile/${profileId}/team`)}
          className="w-full"
        >
          Accéder à l'espace collaboratif
        </Button>
      </CardContent>
    </Card>
  );
}
