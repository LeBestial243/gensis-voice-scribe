
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function ProfileList() {
  const navigate = useNavigate();
  const { data: profiles } = useQuery({
    queryKey: ['young_profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('young_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {profiles?.map((profile) => (
        <Card 
          key={profile.id} 
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => navigate(`/profile/${profile.id}`)}
        >
          <CardHeader>
            <CardTitle>{profile.first_name} {profile.last_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Structure: {profile.structure}</p>
            <p className="text-sm text-muted-foreground">
              Date de naissance: {format(new Date(profile.birth_date), 'PP', { locale: fr })}
            </p>
            <p className="text-sm text-muted-foreground">
              Arrivée: {format(new Date(profile.arrival_date), 'PP', { locale: fr })}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
