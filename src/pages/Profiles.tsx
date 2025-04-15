
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Search, Mic, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CreateProfileForm } from '@/components/CreateProfileForm';
import { ProfileList } from '@/components/ProfileList';
import { MobileNav } from '@/components/MobileNav';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TranscriptionDialog } from '@/components/TranscriptionDialog';
import { FileUploadDialog } from '@/components/FileUploadDialog';
import { FileList } from '@/components/FileList';
import { FolderDialog } from '@/components/FolderDialog';

export default function Profiles() {
  const [openCreateProfile, setOpenCreateProfile] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);

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

  const filteredFolders = folders.filter(folder =>
    folder.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!selectedProfileId) {
    return (
      <div className="container mx-auto py-6 px-4 pb-24">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Mes profils</h1>
          <Dialog open={openCreateProfile} onOpenChange={setOpenCreateProfile}>
            <DialogTrigger asChild>
              <Button>
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
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
        <div className="container flex items-center justify-between h-16">
          {selectedProfile && (
            <h1 className="text-2xl font-bold">
              {selectedProfile.first_name} {selectedProfile.last_name}
            </h1>
          )}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setSelectedProfileId(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            </Button>
            <Button variant="outline" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un dossier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <FolderDialog profileId={selectedProfileId} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFolders.map((folder) => (
            <Card 
              key={folder.id} 
              className={`hover:bg-accent/50 transition-colors cursor-pointer ${
                selectedFolderId === folder.id ? 'bg-accent' : ''
              }`}
              onClick={() => setSelectedFolderId(folder.id)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                  {folder.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {selectedFolderId === folder.id && (
                    <FileUploadDialog folderId={folder.id} />
                  )}
                  <Badge variant="secondary">
                    0 fichiers
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Dernière modification il y a 2 jours
                </p>
                {selectedFolderId === folder.id && (
                  <div className="mt-4">
                    <FileList folderId={folder.id} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Button
        onClick={() => setIsRecorderOpen(true)}
        className="fixed bottom-24 left-1/2 transform -translate-x-1/2 rounded-full h-16 w-16 shadow-lg flex items-center justify-center gradient-bg"
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
        className="fixed bottom-24 right-4 animate-pulse hover:animate-none"
        size="lg"
      >
        Générer une note IA
      </Button>
    </div>
  );
}
