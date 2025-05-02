
import { useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CriticalIncidentAnalysis } from '@/components/critical-incidents/CriticalIncidentAnalysis';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CriticalIncidentsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const profileId = id || '';
  
  const { data: profile, isLoading } = useQuery({
    queryKey: ['young_profile', profileId],
    queryFn: async () => {
      if (!profileId) throw new Error('ID de profil manquant');
      
      const { data, error } = await supabase
        .from('young_profiles')
        .select('*')
        .eq('id', profileId)
        .single();
      
      if (error) {
        toast({
          title: "Erreur de chargement",
          description: `Impossible de charger le profil: ${error.message}`,
          variant: "destructive"
        });
        throw error;
      }
      return data;
    },
    enabled: !!profileId,
  });

  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-72" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container py-6 space-y-6">
        <div className="text-center space-y-4 p-8 bg-white rounded-xl shadow-md">
          <h1 className="text-2xl font-bold text-gray-800">Profil non trouvé</h1>
          <p className="text-muted-foreground">
            Le profil que vous recherchez n'existe pas ou a été supprimé.
          </p>
          <Button onClick={() => navigate(-1)}>
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/young-profile/${profileId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">
            Analyse des incidents - {profile.first_name} {profile.last_name}
          </h1>
        </div>
      </div>
      
      <CriticalIncidentAnalysis profileId={profileId} />
    </div>
  );
}
