
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProfileCard } from "./ProfileCard";
import { useState } from "react";

interface ProfileListProps {
  onSelectProfile: (id: string) => void;
}

export function ProfileList({ onSelectProfile }: ProfileListProps) {
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('young_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleToggleProfile = (profileId: string) => {
    setExpandedProfileId(currentId => currentId === profileId ? null : profileId);
  };

  if (isLoading) {
    return <div className="text-center p-4">Chargement des profils...</div>;
  }

  if (!profiles?.length) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/50">
        <p className="text-muted-foreground mb-4">Aucun profil trouvé</p>
        <p className="text-sm">Créez un nouveau profil pour commencer</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {profiles.map((profile) => (
        <ProfileCard
          key={profile.id}
          profile={profile}
          isOpen={expandedProfileId === profile.id}
          onToggle={handleToggleProfile}
        />
      ))}
    </div>
  );
}
