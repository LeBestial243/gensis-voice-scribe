
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { differenceInYears, format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FoldersList } from '@/components/young-profile/FoldersList';
import { TranscriptionsList } from '@/components/young-profile/TranscriptionsList';
import { NotesList } from '@/components/young-profile/NotesList';
import { RecordingDialog } from '@/components/young-profile/RecordingDialog';
import { useToast } from '@/hooks/use-toast';

export default function YoungProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('transcriptions');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isRecordingOpen, setIsRecordingOpen] = useState(false);
  const { toast } = useToast();

  // Fetch young profile data with better error handling
  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['young_profile', id],
    queryFn: async () => {
      console.log('Fetching profile with ID:', id);
      const { data, error } = await supabase
        .from('young_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
      
      console.log('Profile data:', data);
      return data;
    },
  });

  // Calculate age from birth_date
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    return differenceInYears(new Date(), parseISO(birthDate));
  };

  // Format date to human readable
  const formatDate = (date: string) => {
    if (!date) return '';
    return format(parseISO(date), 'dd MMMM yyyy', { locale: fr });
  };

  // Handle loading state
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Handle error state with better user feedback
  if (profileError || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Profil non trouvé</h1>
          <p className="text-muted-foreground">
            {profileError ? 
              `Erreur lors du chargement du profil: ${(profileError as Error).message}` : 
              "Le profil que vous recherchez n'existe pas ou a été supprimé."}
          </p>
          <Button 
            className="mt-4" 
            onClick={() => navigate('/profiles')}
          >
            Retour aux profils
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
        <div className="container flex items-center h-16">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate('/profiles')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg md:text-xl font-bold truncate">
            {profile.first_name} {profile.last_name}
          </h1>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Profile Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl font-bold">
              {profile.first_name} {profile.last_name}
            </CardTitle>
            <CardDescription>
              {calculateAge(profile.birth_date) && (
                <span className="mr-2">{calculateAge(profile.birth_date)} ans</span>
              )}
              {profile.structure && (
                <span className="mr-2">• {profile.structure}</span>
              )}
              {profile.arrival_date && (
                <span>• Arrivé(e) le {formatDate(profile.arrival_date)}</span>
              )}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Search and Tabs */}
        <div className="flex justify-between items-center">
          <Tabs 
            className="w-full" 
            value={selectedTab} 
            onValueChange={setSelectedTab}
          >
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="transcriptions">Transcriptions</TabsTrigger>
                <TabsTrigger value="folders">Dossiers</TabsTrigger>
                <TabsTrigger value="ia-notes">Notes IA</TabsTrigger>
              </TabsList>
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <TabsContent value="transcriptions" className="mt-0">
              <TranscriptionsList 
                profileId={id || ''} 
                folderId={selectedFolderId}
                searchQuery={searchQuery}
              />
            </TabsContent>

            <TabsContent value="folders" className="mt-0">
              <FoldersList 
                profileId={id || ''} 
                searchQuery={searchQuery}
                onFolderSelect={setSelectedFolderId}
                selectedFolderId={selectedFolderId}
              />
            </TabsContent>

            <TabsContent value="ia-notes" className="mt-0">
              <NotesList 
                profileId={id || ''} 
                searchQuery={searchQuery}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Floating Record Button */}
      <Button
        onClick={() => setIsRecordingOpen(true)}
        className="fixed bottom-24 left-1/2 transform -translate-x-1/2 rounded-full h-16 w-16 shadow-lg flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600"
        size="icon"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
      </Button>

      {/* AI Note Generation Button */}
      <Button
        className="fixed bottom-24 right-4 bg-purple-600 hover:bg-purple-700 animate-pulse hover:animate-none"
        size="lg"
        onClick={() => {
          toast({
            title: "Génération en cours...",
            description: "Nous préparons votre note basée sur les données du profil."
          });
        }}
      >
        Générer une note IA
      </Button>

      {/* Recording Dialog */}
      <RecordingDialog 
        open={isRecordingOpen} 
        onOpenChange={setIsRecordingOpen} 
        profileId={id || ''}
      />
    </div>
  );
}
