
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CreateProfileButton } from '@/components/profiles/CreateProfileButton';
import { ProfileContent } from '@/components/profiles/ProfileContent';
import { ProfileList } from '@/components/ProfileList';
import { MobileNav } from '@/components/MobileNav';

export default function Profiles() {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  
  const { data: selectedProfile } = useQuery({
    queryKey: ['profile', selectedProfileId],
    queryFn: async () => {
      if (!selectedProfileId) return null;
      
      const { data, error } = await supabase
        .from('young_profiles')
        .select('*')
        .eq('id', selectedProfileId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!selectedProfileId,
  });

  if (!selectedProfileId) {
    return (
      <div className="container mx-auto py-6 px-4 pb-24">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Mes profils</h1>
          <CreateProfileButton />
        </div>

        <ProfileList onSelectProfile={setSelectedProfileId} />
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <ProfileContent
        profileId={selectedProfileId}
        firstName={selectedProfile?.first_name}
        lastName={selectedProfile?.last_name}
        onBack={() => setSelectedProfileId(null)}
      />
      <MobileNav />
    </div>
  );
}
