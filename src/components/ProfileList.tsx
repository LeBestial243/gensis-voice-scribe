
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export function ProfileList({ onSelectProfile }: { onSelectProfile?: (id: string) => void }) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: profiles, isLoading, error } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      console.log('Fetching profiles');
      const { data, error } = await supabase
        .from('young_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching profiles:', error);
        throw error;
      }

      console.log('Profiles data:', data);
      return data;
    },
  });

  const handleProfileClick = (id: string) => {
    console.log('Profile clicked, ID:', id);
    if (onSelectProfile) {
      onSelectProfile(id);
    } else {
      // Assurez-vous d'utiliser l'ID réel dans l'URL, pas le littéral :id
      navigate(`/young_profiles/${id}`);
    }
  };

  if (isLoading) {
    return <p>Chargement des profils...</p>;
  }

  if (error) {
    toast({
      title: "Erreur",
      description: "Impossible de charger les profils",
      variant: "destructive"
    });
    return <p>Erreur lors du chargement des profils.</p>;
  }

  if (!profiles || profiles.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/50">
        <p className="text-muted-foreground mb-4">Aucun profil trouvé</p>
        <p className="text-sm">Créez un nouveau profil pour commencer</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {profiles?.map((profile) => (
        <Card 
          key={profile.id} 
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => handleProfileClick(profile.id)}
        >
          <CardHeader>
            <CardTitle>{profile.first_name} {profile.last_name}</CardTitle>
            <CardDescription>
              {profile.structure || "Aucune structure"} • 
              {new Date(profile.arrival_date).toLocaleDateString('fr-FR')}
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
