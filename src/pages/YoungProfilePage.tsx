import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProfileHeader } from '@/components/young-profile/ProfileHeader';
import { SearchTabs } from '@/components/young-profile/SearchTabs';
import { FloatingActions } from '@/components/young-profile/FloatingActions';
import { RecordingDialog } from '@/components/young-profile/RecordingDialog';
import { GenerateNoteDialog } from '@/components/young-profile/generate-note/GenerateNoteDialog';
import { useToast } from '@/hooks/use-toast';
import { useQueryCache } from '@/hooks/useQueryCache';
import { Skeleton } from '@/components/ui/skeleton';
import { TranscriptionDialog } from '@/components/TranscriptionDialog';

export default function YoungProfilePage() {
  const { id } = useParams<{ id: string }>();
  const profileId = id || '';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('transcriptions');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [isRecordingOpen, setIsRecordingOpen] = useState(false);
  const [isGenerateNoteOpen, setIsGenerateNoteOpen] = useState(false);
  const { toast } = useToast();
  const { invalidateProfile } = useQueryCache();
  const queryClient = useQueryClient();

  const refreshData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['young_profile', profileId] });
    queryClient.invalidateQueries({ queryKey: ['folders', profileId] });
    queryClient.invalidateQueries({ queryKey: ['files'] });
    queryClient.invalidateQueries({ queryKey: ['transcriptions'] });
    queryClient.invalidateQueries({ queryKey: ['notes'] });
  }, [profileId, queryClient]);

  useEffect(() => {
    const handleProfileDataChange = () => {
      if (profileId) {
        refreshData();
      }
    };

    window.addEventListener('profile:data-changed', handleProfileDataChange);
    return () => window.removeEventListener('profile:data-changed', handleProfileDataChange);
  }, [profileId, refreshData]);

  useEffect(() => {
    setSearchQuery('');
    setSelectedTab('transcriptions');
    setActiveFolderId(null);
    setIsRecordingOpen(false);
    setIsGenerateNoteOpen(false);
  }, [profileId]);

  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
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
    staleTime: 5000,
  });

  const { data: folders = [] } = useQuery({
    queryKey: ['folders', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('id, title')
        .eq('profile_id', profileId);

      if (error) {
        toast({
          title: "Erreur de chargement",
          description: `Impossible de charger les dossiers: ${error.message}`,
          variant: "destructive" 
        });
        throw error;
      }
      return data;
    },
    enabled: !!profileId,
    staleTime: 5000,
  });

  const folderIds = folders.map(folder => folder.id);

  const handleOpenGenerateNote = useCallback(() => {
    setIsGenerateNoteOpen(true);
  }, []);

  const handleCloseRecordingDialog = useCallback(() => {
    setIsRecordingOpen(false);
    refreshData();
  }, [refreshData]);

  const handleCloseGenerateNoteDialog = useCallback(() => {
    setIsGenerateNoteOpen(false);
    refreshData();
  }, [refreshData]);

  const handleTabChange = (tab: string) => {
    setSelectedTab(tab);
    setSearchQuery('');
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen pb-24 bg-gray-50">
        <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 flex items-end">
          <div className="container py-6">
            <Skeleton className="h-10 w-64 bg-white/20" />
            <Skeleton className="h-6 w-32 mt-2 bg-white/20" />
          </div>
        </div>
        <main className="container py-6 space-y-6">
          <div className="flex justify-between">
            <Skeleton className="h-12 w-96 rounded-xl" />
            <Skeleton className="h-12 w-32 rounded-xl" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </main>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center space-y-4 p-8 bg-white rounded-xl shadow-md">
          <h1 className="text-2xl font-bold text-gray-800">Profil non trouvé</h1>
          <p className="text-muted-foreground">
            Le profil que vous recherchez n'existe pas ou a été supprimé.
          </p>
          <button 
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour
          </button>
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
          onTabChange={handleTabChange}
          selectedFolderId={activeFolderId}
          onFolderSelect={setActiveFolderId}
        />
      </main>

      <FloatingActions 
        onRecordingClick={() => setIsRecordingOpen(true)}
        onGenerateNoteClick={handleOpenGenerateNote}
      />

      <TranscriptionDialog
        key={`transcription-dialog-${isRecordingOpen}`}
        open={isRecordingOpen}
        onOpenChange={handleCloseRecordingDialog}
        profileId={profileId}
        folders={folders}
        youngProfile={profile}
      />

      <GenerateNoteDialog
        key={`generate-note-dialog-${isGenerateNoteOpen}`}
        open={isGenerateNoteOpen}
        onOpenChange={handleCloseGenerateNoteDialog}
        profileId={profileId}
      />
    </div>
  );
}
