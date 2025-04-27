
import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProfileHeader } from '@/components/young-profile/ProfileHeader';
import { SearchTabs } from '@/components/young-profile/SearchTabs';
import { FloatingActions } from '@/components/young-profile/FloatingActions';
import { RecordingDialog } from '@/components/young-profile/RecordingDialog';
import { GenerateNoteDialog } from '@/components/young-profile/generate-note/GenerateNoteDialog';
import { FolderDisplay } from '@/components/FolderDisplay';
import { TranscriptionsList } from '@/components/TranscriptionsList';
import { NotesList } from '@/components/young-profile/NotesList';
import { useToast } from '@/hooks/use-toast';
import { useQueryCache } from '@/hooks/useQueryCache';
import { Skeleton } from '@/components/ui/skeleton';

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

  // Optimise le rechargement des données après des actions importantes
  useEffect(() => {
    const handleProfileDataChange = () => {
      if (profileId) {
        invalidateProfile(profileId);
      }
    };

    // Écouter les événements qui indiquent des modifications de données
    window.addEventListener('profile:data-changed', handleProfileDataChange);
    
    return () => {
      window.removeEventListener('profile:data-changed', handleProfileDataChange);
    };
  }, [profileId, invalidateProfile]);

  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['young_profile', profileId],
    queryFn: async () => {
      if (!profileId) {
        throw new Error('ID de profil manquant');
      }

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
  });

  const folderIds = folders.map(folder => folder.id);

  const handleOpenGenerateNote = useCallback(() => {
    setIsGenerateNoteOpen(true);
  }, []);

  const handleTabChange = (tab: string) => {
    setSelectedTab(tab);
    // Réinitialiser la recherche lors du changement d'onglet
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
        
        {selectedTab === "transcriptions" && (
          <TranscriptionsList 
            profileId={profileId} 
            searchQuery={searchQuery}
            folderIds={activeFolderId ? [activeFolderId] : folderIds}
          />
        )}
        
        {selectedTab === "notes" && (
          <NotesList 
            profileId={profileId}
            searchQuery={searchQuery}
          />
        )}
        
        {selectedTab === "files" && (
          <FolderDisplay 
            profileId={profileId} 
            searchQuery={searchQuery}
            activeFolderId={activeFolderId}
            onFolderSelect={setActiveFolderId}
            key={`folders-${profileId}-${searchQuery}`}
          />
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
