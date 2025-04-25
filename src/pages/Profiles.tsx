import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Search, Mic, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CreateProfileForm } from '@/components/CreateProfileForm';
import { ProfileList } from '@/components/ProfileList';
import { MobileNav } from '@/components/MobileNav';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TranscriptionDialog } from '@/components/TranscriptionDialog';
import { FileUploadDialog } from '@/components/FileUploadDialog';
import { FileList } from '@/components/FileList';
import { FolderDialog } from '@/components/FolderDialog';
import { GenerateNoteDialog } from '@/components/young-profile/generate-note/GenerateNoteDialog';
import { FolderDisplay } from '@/components/FolderDisplay';

export default function Profiles() {
  const [openCreateProfile, setOpenCreateProfile] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);
  const [isGenerateNoteOpen, setIsGenerateNoteOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setSelectedFolderId(null);
  }, [selectedProfileId]);

  useEffect(() => {
    if (selectedProfileId) {
      console.log("Profiles: Selected profile changed, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ['folders', selectedProfileId] });
      queryClient.invalidateQueries({ queryKey: ['folder_counts'] });
    }
  }, [selectedProfileId, queryClient]);

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
    console.log("Profiles: Setting selected folder ID to", folderId, "from", selectedFolderId);
    setSelectedFolderId(folderId);
  };

  if (!selectedProfileId) {
    return (
      <div className="container mx-auto py-8 px-4 pb-24">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-title">Mes profils</h1>
          <Dialog open={openCreateProfile} onOpenChange={setOpenCreateProfile}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#9867F0] to-[#5B86E5] text-white px-4 py-2 font-semibold rounded-full shadow-md hover:shadow-lg transition duration-300 ease-in-out">
                <Plus className="h-4 w-4 mr-2" />
                Créer un profil
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Créer un nouveau profil</DialogTitle>
              </DialogHeader>
              <CreateProfileForm />
            </DialogContent>
          </Dialog>
        </div>

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
        <div className="flex justify-between items-center">
          <div className="relative flex-1 max-w-sm bg-muted rounded-xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un dossier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-0 shadow-none bg-transparent"
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

      <Button
        onClick={() => setIsRecorderOpen(true)}
        className="fixed bottom-24 left-1/2 transform -translate-x-1/2 rounded-full h-16 w-16 shadow-lg flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600 interactive"
        size="icon"
      >
        <Mic className="h-6 w-6 text-white" />
      </Button>

      <TranscriptionDialog 
        open={isRecorderOpen} 
        onOpenChange={setIsRecorderOpen} 
        profileId={selectedProfileId} 
        folders={folders}
      />

      <Button
        className="fixed bottom-24 right-4 bg-gradient-to-r from-accent to-purple-700 hover:bg-purple-700 interactive text-white shadow-lg"
        size="lg"
        onClick={() => {
          console.log('Generate note button clicked in Profiles');
          setIsGenerateNoteOpen(true);
        }}
      >
        Générer une note IA
      </Button>

      {selectedProfileId && (
        <GenerateNoteDialog
          open={isGenerateNoteOpen}
          onOpenChange={setIsGenerateNoteOpen}
          profileId={selectedProfileId}
        />
      )}
    </div>
  );
}
