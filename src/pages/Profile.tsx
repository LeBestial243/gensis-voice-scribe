
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Edit, Search, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FolderDialog } from '@/components/FolderDialog';
import { FileUploadDialog } from '@/components/FileUploadDialog';
import { TranscriptionDialog } from '@/components/TranscriptionDialog';
import { FolderCarousel } from '@/components/FolderCarousel';
import { TranscriptionsList } from '@/components/TranscriptionsList';

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['profile', id],
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

  const { data: folders = [] } = useQuery({
    queryKey: ['folders', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('profile_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
        <div className="container flex items-center justify-between h-16">
          {profile && (
            <h1 className="text-2xl font-bold">
              {profile.first_name} {profile.last_name}
            </h1>
          )}
          <Button variant="outline" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="container py-6 space-y-8">
        {/* Search Bar */}
        <div className="flex justify-between items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher dans les dossiers et transcriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <FolderDialog profileId={id || ''} />
        </div>

        {/* Folders Carousel */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Dossiers</h2>
          <FolderCarousel folders={folders} searchQuery={searchQuery} />
        </section>

        {/* Transcriptions List */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Transcriptions</h2>
          <TranscriptionsList searchQuery={searchQuery} profileId={id || ''} />
        </section>
      </main>

      {/* Recording Button */}
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
        profileId={id || ''} 
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
