
import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProfileHeader } from '@/components/young-profile/ProfileHeader';
import { SearchTabs } from '@/components/young-profile/SearchTabs';
import { FloatingActions } from '@/components/young-profile/FloatingActions';
import { RecordingDialog } from '@/components/young-profile/RecordingDialog';
import { GenerateNoteDialog } from '@/components/young-profile/generate-note/GenerateNoteDialog';
import { useToast } from '@/hooks/use-toast';
import { FolderDisplay } from '@/components/FolderDisplay';

export default function YoungProfilePage() {
  const { id } = useParams<{ id: string }>();
  const profileId = id || '';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('transcriptions');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isRecordingOpen, setIsRecordingOpen] = useState(false);
  const [isGenerateNoteOpen, setIsGenerateNoteOpen] = useState(false);
  const { toast } = useToast();

  console.log('YoungProfilePage: Loading profile with ID:', profileId);
  
  useEffect(() => {
    console.log('YoungProfilePage: isGenerateNoteOpen state updated:', isGenerateNoteOpen);
  }, [isGenerateNoteOpen]);

  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['young_profile', profileId],
    queryFn: async () => {
      console.log('Fetching profile with ID:', profileId);

      if (!profileId || profileId === ':id') {
        throw new Error('ID de profil invalide');
      }

      const { data, error } = await supabase
        .from('young_profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
      
      console.log('Profile data:', data);
      return data;
    },
    enabled: !!profileId && profileId !== ':id',
  });

  const handleOpenGenerateNote = useCallback(() => {
    console.log('Opening note generation dialog');
    setIsGenerateNoteOpen(true);
  }, []);

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center space-y-4 p-8 bg-white rounded-xl shadow-md">
          <h1 className="text-2xl font-bold text-gray-800">Profil non trouvé</h1>
          <p className="text-muted-foreground">
            {profileError ? 
              `Erreur lors du chargement du profil: ${(profileError as Error).message}` : 
              "Le profil que vous recherchez n'existe pas ou a été supprimé."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-gray-50">
      <ProfileHeader profile={profile} />

      <main className="container py-6 space-y-6">
        <SearchTabs 
          profileId={profileId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedTab={selectedTab}
          onTabChange={setSelectedTab}
          selectedFolderId={selectedFolderId}
          onFolderSelect={setSelectedFolderId}
        />
        {selectedTab === "files" && (
          <FolderDisplay profileId={profileId} searchQuery={searchQuery} />
        )}
      </main>

      <FloatingActions 
        onRecordingClick={() => setIsRecordingOpen(true)}
        onGenerateNoteClick={handleOpenGenerateNote}
      />

      <RecordingDialog 
        open={isRecordingOpen} 
        onOpenChange={setIsRecordingOpen} 
        profileId={profileId}
      />

      <GenerateNoteDialog
        open={isGenerateNoteOpen}
        onOpenChange={setIsGenerateNoteOpen}
        profileId={profileId}
      />
    </div>
  );
}
