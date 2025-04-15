import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export function ProfileList({ onSelectProfile }: { onSelectProfile?: (id: string) => void }) {
  const navigate = useNavigate();

  const { data: profiles, isLoading, error } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('young_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data;
    },
  });

  const handleProfileClick = (id: string) => {
    if (onSelectProfile) {
      onSelectProfile(id);
    } else {
      navigate(`/young_profiles/${id}`);
    }
  };

  if (isLoading) {
    return <p>Chargement des profils...</p>;
  }

  if (error) {
    return <p>Erreur lors du chargement des profils.</p>;
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
