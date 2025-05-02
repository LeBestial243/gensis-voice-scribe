
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EducationalProjectGenerator } from '@/components/casf/projects/EducationalProjectGenerator';
import { useYoungProfile } from '@/hooks/use-young-profile';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function EducationalProjectGeneratorPage() {
  const { id: profileId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: profile, isLoading } = useYoungProfile(profileId || '');
  
  const handleProjectCreated = (projectId: string) => {
    navigate(`/young_profiles/${profileId}/projects/${projectId}`);
  };
  
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
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Retour
      </Button>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Générateur de projet éducatif</h1>
        <p className="text-muted-foreground mt-1">
          Pour {profile.first_name} {profile.last_name}
        </p>
      </div>
      
      <EducationalProjectGenerator 
        profileId={profileId || ''} 
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}
