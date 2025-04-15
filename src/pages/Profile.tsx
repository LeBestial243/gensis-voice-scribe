
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Edit, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Type for profile data
type Profile = {
  id: string;
  first_name: string;
  last_name: string;
};

// Type for folder data (mock for now)
type Folder = {
  id: string;
  title: string;
  fileCount: number;
};

// Mock folders data
const mockFolders: Folder[] = [
  { id: '1', title: 'Dossier scolaire', fileCount: 3 },
  { id: '2', title: 'Suivi médical', fileCount: 2 },
  { id: '3', title: 'Documents administratifs', fileCount: 5 },
  { id: '4', title: 'Activités extrascolaires', fileCount: 1 },
];

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['profile', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('young_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Profile;
    },
  });

  const filteredFolders = mockFolders.filter(folder =>
    folder.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
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

      <main className="container py-6 space-y-6">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher un dossier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Folders grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFolders.map((folder) => (
            <Card key={folder.id} className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                  {folder.title}
                </CardTitle>
                <Badge variant="secondary">
                  {folder.fileCount} fichier{folder.fileCount > 1 ? 's' : ''}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Dernière modification il y a 2 jours
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* AI Note Button */}
      <Button
        className="fixed bottom-24 right-4 animate-pulse hover:animate-none"
        size="lg"
      >
        Générer une note IA
      </Button>
    </div>
  );
}
