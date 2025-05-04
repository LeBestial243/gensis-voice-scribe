
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useYoungProfile } from '@/hooks/use-young-profile';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { TeamCollaboration } from '@/components/team-collaboration/TeamCollaboration';

export default function TeamCollaborationPage() {
  const { id: profileId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: profile, isLoading } = useYoungProfile(profileId || '');
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center p-12">
          <h2 className="text-2xl font-bold mb-4">Profil non trouvé</h2>
          <p className="text-muted-foreground mb-6">
            Le profil que vous recherchez n'existe pas ou a été supprimé.
          </p>
          <Button onClick={() => navigate('/profiles')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux profils
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mr-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour
          </Button>
          <h1 className="text-3xl font-bold">Collaboration d'équipe</h1>
        </div>
        <div>
          <h2 className="text-xl font-medium text-muted-foreground">
            {profile.first_name} {profile.last_name}
          </h2>
        </div>
      </div>
      
      <TeamCollaboration profileId={profileId || ''} />
    </div>
  );
}
