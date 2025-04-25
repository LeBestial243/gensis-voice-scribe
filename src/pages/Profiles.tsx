
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileList } from '@/components/ProfileList';
import { MobileNav } from '@/components/MobileNav';
import { ProfileListHeader } from '@/components/profiles/ProfileListHeader';
import { ProfileFilesSection } from '@/components/profiles/ProfileFilesSection';
import { ProfileFloatingActions } from '@/components/profiles/ProfileFloatingActions';

export default function Profiles() {
  const [openCreateProfile, setOpenCreateProfile] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);
  const [isGenerateNoteOpen, setIsGenerateNoteOpen] = useState(false);

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

  const { data: folders = [] } = useQuery({
    queryKey: ['folders', selectedProfileId],
    queryFn: async () => {
      if (!selectedProfileId) return [];
      
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('profile_id', selectedProfileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!selectedProfileId,
  });

  if (!selectedProfileId) {
    return (
      <div className="container mx-auto py-8 px-4 pb-24">
        <ProfileListHeader 
          openCreateProfile={openCreateProfile}
          setOpenCreateProfile={setOpenCreateProfile}
        />
        <ProfileList onSelectProfile={setSelectedProfileId} />
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm shadow-md rounded-xl mx-4 my-2">
        <div className="container flex items-center justify-between h-16">
          {selectedProfile && (
            <h1 className="text-2xl font-bold text-title">
              {selectedProfile.first_name} {selectedProfile.last_name}
            </h1>
          )}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSelectedProfileId(null)}
              className="interactive"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left text-accent"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            </Button>
            <Button variant="ghost" size="icon" className="interactive">
              <Edit className="h-4 w-4 text-accent" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        <ProfileFilesSection selectedProfileId={selectedProfileId} />
      </main>

      <ProfileFloatingActions
        selectedProfileId={selectedProfileId}
        isRecorderOpen={isRecorderOpen}
        setIsRecorderOpen={setIsRecorderOpen}
        isGenerateNoteOpen={isGenerateNoteOpen}
        setIsGenerateNoteOpen={setIsGenerateNoteOpen}
        folders={folders}
      />
    </div>
  );
}
