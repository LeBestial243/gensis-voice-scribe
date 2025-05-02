
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GradientButton } from '@/components/ui/GradientButton';
import { Plus, Search, Mic, Edit, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CreateProfileForm } from '@/components/CreateProfileForm';
import { ProfileList } from '@/components/ProfileList';
import { EnhancedProfilesList } from '@/components/EnhancedProfilesList';
import { MobileNav } from '@/components/MobileNav';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TranscriptionDialog } from '@/components/TranscriptionDialog';
import { FileUploadDialog } from '@/components/FileUploadDialog';
import { FileList } from '@/components/FileList';
import { FolderDialog } from '@/components/FolderDialog';
import { GenerateNoteDialog } from '@/components/young-profile/generate-note/GenerateNoteDialog';
import { FolderDisplay } from '@/components/FolderDisplay';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useQueryCache } from '@/hooks/useQueryCache';
import { FloatingActions } from '@/components/young-profile/FloatingActions';
import { useNavigate } from 'react-router-dom';

export default function Profiles() {
  const [openCreateProfile, setOpenCreateProfile] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);
  const [isGenerateNoteOpen, setIsGenerateNoteOpen] = useState(false);
  const queryClient = useQueryClient();
  const { setupKeyboardNavigation } = useAccessibility();
  const { optimizeCacheConfig } = useQueryCache();
  const navigate = useNavigate();

  useEffect(() => {
    optimizeCacheConfig();
  }, [optimizeCacheConfig]);
  
  useEffect(() => {
    setupKeyboardNavigation('profiles-container');
  }, [setupKeyboardNavigation]);

  useEffect(() => {
    if (selectedProfileId) {
      queryClient.invalidateQueries({ queryKey: ['folders', selectedProfileId] });
      queryClient.invalidateQueries({ queryKey: ['folder_counts'] });
    }
  }, [selectedProfileId, queryClient]);

  const { data: foldersList = [] } = useQuery({
    queryKey: ['folders_list', selectedProfileId],
    queryFn: async () => {
      if (!selectedProfileId) return [];
      
      const { data, error } = await supabase
        .from('folders')
        .select('id,title')
        .eq('profile_id', selectedProfileId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedProfileId,
  });

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

  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolderId(folderId);
  };

  const handleGenerateNoteClick = () => {
    setIsGenerateNoteOpen(true);
  };

  const handlePriorityDashboardClick = () => {
    navigate('/priority-dashboard');
  };

  if (!selectedProfileId) {
    return (
      <div className="container mx-auto py-8 px-4 pb-24" id="profiles-container">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gensys-primary-from to-gensys-primary-to bg-clip-text text-transparent">
              Mes profils
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Gérez vos suivis éducatifs et accédez aux données des jeunes
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex gap-2 items-center"
              onClick={handlePriorityDashboardClick}
            >
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="hidden sm:inline">Tableau des priorités</span>
            </Button>
            <Dialog open={openCreateProfile} onOpenChange={setOpenCreateProfile}>
              <DialogTrigger asChild>
                <GradientButton aria-label="Créer un nouveau profil">
                  <span className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Créer un profil</span>
                  </span>
                </GradientButton>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Créer un nouveau profil</DialogTitle>
                </DialogHeader>
                <CreateProfileForm />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <EnhancedProfilesList onSelectProfile={setSelectedProfileId} />
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm shadow-md rounded-xl mx-4 my-2" role="banner">
        <div className="container flex items-center justify-between h-16">
          {selectedProfile && (
            <h1 
              className="text-2xl font-bold text-title"
              tabIndex={0}
              aria-label={`Profil de ${selectedProfile.first_name} ${selectedProfile.last_name}`}
            >
              {selectedProfile.first_name} {selectedProfile.last_name}
            </h1>
          )}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSelectedProfileId(null)}
              className="interactive"
              aria-label="Retour à la liste des profils"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left text-accent" aria-hidden="true"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="interactive"
              aria-label="Modifier le profil"
            >
              <Edit className="h-4 w-4 text-accent" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6" role="main">
        <div className="flex justify-between items-center">
          <div className="relative flex-1 max-w-sm bg-muted rounded-xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              placeholder="Rechercher un dossier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-0 shadow-none bg-transparent"
              aria-label="Rechercher un dossier"
            />
          </div>
        </div>

        <FolderDisplay 
          key={`folder-display-${selectedProfileId}`}
          profileId={selectedProfileId} 
          searchQuery={searchQuery} 
          activeFolderId={selectedFolderId}
          onFolderSelect={handleFolderSelect}
        />
      </main>

      <FloatingActions 
        onRecordingClick={() => setIsRecorderOpen(true)}
        onGenerateNoteClick={handleGenerateNoteClick}
      />

      <TranscriptionDialog 
        open={isRecorderOpen} 
        onOpenChange={setIsRecorderOpen} 
        profileId={selectedProfileId} 
        folders={foldersList}
        youngProfile={selectedProfile}
      />

      {selectedProfileId && (
        <GenerateNoteDialog
          open={isGenerateNoteOpen}
          onOpenChange={setIsGenerateNoteOpen}
          profileId={selectedProfileId}
        />
      )}
      
      <MobileNav />
    </div>
  );
}
