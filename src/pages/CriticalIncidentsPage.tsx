
import { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CriticalIncidentAnalysis } from '@/components/critical-incidents/CriticalIncidentAnalysis';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { useYoungProfile } from '@/hooks/use-young-profile';

export default function CriticalIncidentsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  // Utilisez l'ID dans le paramètre d'URL ou accédez à la vue générale
  const isGenericView = !id;
  
  // Si nous sommes sur la vue générale, nous n'avons pas besoin de charger un profil spécifique
  const { data: profile, isLoading, isError } = useYoungProfile(id || '');
  
  // Déterminer si nous devons charger le profil (uniquement si nous avons un ID)
  const shouldLoadProfile = !!id;
  
  // Récupérer la liste des profils pour la vue générale
  const { data: profiles = [] } = useQuery({
    queryKey: ['young_profiles_list'],
    queryFn: async () => {
      if (!isGenericView) return [];
      
      const { data, error } = await supabase
        .from('young_profiles')
        .select('id, first_name, last_name')
        .order('last_name', { ascending: true });
      
      if (error) {
        toast({
          title: "Erreur de chargement",
          description: `Impossible de charger la liste des profils: ${error.message}`,
          variant: "destructive"
        });
        throw error;
      }
      return data || [];
    },
    enabled: isGenericView,
  });
  
  // Si nous sommes sur la page générale, mais que nous venons de charger les profils
  // et qu'il n'y en a qu'un seul, redirigeons vers sa page d'incidents
  useEffect(() => {
    if (isGenericView && profiles.length === 1) {
      navigate(`/critical-incidents/${profiles[0].id}`);
    }
  }, [isGenericView, profiles, navigate]);

  // Si nous sommes dans une vue spécifique mais que le chargement échoue
  if (shouldLoadProfile && isLoading) {
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

  // Si nous sommes dans une vue spécifique mais que le profil n'existe pas
  if (shouldLoadProfile && (isError || !profile)) {
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

  // Vue générale - liste des profils pour sélection
  if (isGenericView) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Analyse des incidents critiques</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map(profile => (
            <div 
              key={profile.id}
              className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/critical-incidents/${profile.id}`)}
            >
              <h2 className="text-lg font-semibold">{profile.first_name} {profile.last_name}</h2>
              <p className="text-sm text-muted-foreground mt-1">Consulter les incidents</p>
            </div>
          ))}
          
          {profiles.length === 0 && (
            <div className="col-span-full text-center p-12 bg-white rounded-xl shadow-sm">
              <p className="text-muted-foreground">Aucun profil trouvé pour l'analyse d'incidents.</p>
              <Button 
                className="mt-4" 
                onClick={() => navigate('/profiles')}
              >
                Gérer les profils
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vue spécifique à un profil
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/young-profile/${profile.id}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">
            Analyse des incidents - {profile.first_name} {profile.last_name}
          </h1>
        </div>
      </div>
      
      <CriticalIncidentAnalysis profileId={profile.id} />
    </div>
  );
}
