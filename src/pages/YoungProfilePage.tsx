
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Clock, Calendar, Home, GraduationCap } from 'lucide-react';
import { FoldersList } from '@/components/young-profile/FoldersList';
import { TranscriptionsList } from '@/components/young-profile/TranscriptionsList';
import { NotesList } from '@/components/young-profile/NotesList';

export default function YoungProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('files');

  // Récupérer les informations du profil jeune
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['young_profile', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('young_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Calculer l'âge à partir de la date de naissance
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }).format(date);
  };

  if (isLoadingProfile) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
        <div className="container flex items-center justify-between h-16">
          {profile && (
            <h1 className="text-xl font-bold truncate">
              {profile.first_name} {profile.last_name}
            </h1>
          )}
          <Button variant="outline" size="sm" onClick={() => window.history.back()}>
            Retour
          </Button>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Entête Profil */}
        {profile && (
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    {profile.first_name} {profile.last_name}
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    {calculateAge(profile.birth_date)} ans
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.structure && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Home className="h-3 w-3" />
                      <span>{profile.structure}</span>
                    </Badge>
                  )}
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Arrivé(e) le {formatDate(profile.arrival_date)}</span>
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <p className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Date de naissance: {formatDate(profile.birth_date)}</span>
                </p>
                {profile.project_pro && (
                  <p className="flex items-center gap-1 mt-1">
                    <GraduationCap className="h-3 w-3" />
                    <span>Projet professionnel: {profile.project_pro}</span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Barre de recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher dans les transcriptions et notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Onglets pour la navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="files">Transcriptions</TabsTrigger>
            <TabsTrigger value="folders">Dossiers</TabsTrigger>
            <TabsTrigger value="notes">Notes IA</TabsTrigger>
          </TabsList>
          
          {/* Contenu des onglets */}
          <TabsContent value="files" className="mt-4">
            <ScrollArea className="h-[60vh]">
              <TranscriptionsList 
                profileId={id || ''} 
                searchQuery={searchQuery}
                selectedFolderId={selectedFolderId}
              />
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="folders" className="mt-4">
            <ScrollArea className="h-[60vh]">
              <FoldersList 
                profileId={id || ''} 
                searchQuery={searchQuery}
                selectedFolderId={selectedFolderId}
                onSelectFolder={setSelectedFolderId}
              />
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="notes" className="mt-4">
            <ScrollArea className="h-[60vh]">
              <NotesList 
                profileId={id || ''} 
                searchQuery={searchQuery}
              />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </main>

      {/* Bouton flottant pour générer une note IA */}
      <Button
        className="fixed bottom-24 right-4 shadow-lg animate-pulse hover:animate-none"
        size="lg"
      >
        Générer une note IA
      </Button>
    </div>
  );
}
