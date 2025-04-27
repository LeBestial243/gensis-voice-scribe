
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomPagination } from "./CustomPagination";

const PROFILES_PER_PAGE = 6;

export function ProfileList({ onSelectProfile }: { onSelectProfile?: (id: string) => void }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);

  // Count total profiles
  const { data: totalCount = 0 } = useQuery({
    queryKey: ['profiles_count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('young_profiles')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    }
  });

  const totalPages = Math.ceil(totalCount / PROFILES_PER_PAGE);

  // Fetch paginated profiles
  const { data: profiles, isLoading, error } = useQuery({
    queryKey: ['profiles', currentPage, PROFILES_PER_PAGE],
    queryFn: async () => {
      const from = (currentPage - 1) * PROFILES_PER_PAGE;
      const to = from + PROFILES_PER_PAGE - 1;
      
      const { data, error } = await supabase
        .from('young_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
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
    return (
      <div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array(3).fill(0).map((_, index) => (
            <Card key={index} className="bg-[#F0F4FF]">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
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
    <div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {profiles.map((profile) => (
          <Card 
            key={profile.id} 
            className="bg-[#F0F4FF] hover:scale-[1.02] transition-all duration-300 ease-in-out cursor-pointer shadow-[8px_8px_16px_rgba(0,0,0,0.1),_-8px_-8px_16px_rgba(255,255,255,0.7)]"
            onClick={() => handleProfileClick(profile.id)}
          >
            <CardHeader>
              <CardTitle className="text-xl font-bold tracking-tight text-gray-800 font-dmsans">
                {profile.first_name} {profile.last_name}
              </CardTitle>
              <CardDescription className="text-sm text-gray-500 font-dmsans">
                {profile.structure || "Aucune structure"} • 
                {new Date(profile.arrival_date).toLocaleDateString('fr-FR')}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
      
      <CustomPagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
