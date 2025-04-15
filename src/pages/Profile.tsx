
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Edit, Search, Mic, Filter, Clock, Calendar, FileText, Copy, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FolderDialog } from '@/components/FolderDialog';
import { FileUploadDialog } from '@/components/FileUploadDialog';
import { FileList } from '@/components/FileList';
import { TranscriptionDialog } from '@/components/TranscriptionDialog';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

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

  // Mock transcriptions data - in a real application, this would come from the database
  const mockTranscriptions = [
    {
      id: "1",
      title: "Observation du 15/04",
      date: "15 avril 2025, 14:30",
      type: "vocal",
      tag: "observation",
      content: "Aujourd'hui, j'ai observé des progrès significatifs dans la capacité de concentration...",
      folderName: "Suivi pédagogique"
    },
    {
      id: "2",
      title: "Incident à la cantine",
      date: "12 avril 2025, 12:15",
      type: "note",
      tag: "incident",
      content: "Un conflit a éclaté pendant le déjeuner suite à une remarque déplacée...",
      folderName: "Incidents"
    },
    {
      id: "3",
      title: "Rencontre avec les parents",
      date: "10 avril 2025, 16:00",
      type: "vocal",
      tag: "autre",
      content: "Entretien avec la mère concernant les progrès réalisés et les difficultés persistantes...",
      folderName: "Réunions parents"
    }
  ];

  // Mock AI generated notes data
  const mockAINotes = [
    {
      id: "101",
      title: "Rapport mensuel d'évolution",
      date: "01 avril 2025",
      template: "Rapport mensuel",
      content: "Synthèse des progrès observés ce mois-ci..."
    },
    {
      id: "102",
      title: "Résumé entretien psychologique",
      date: "28 mars 2025",
      template: "Synthèse entretien",
      content: "Points clés identifiés lors de la dernière séance..."
    }
  ];

  const filteredTranscriptions = mockTranscriptions.filter(item => {
    const matchesSearch = searchQuery.trim() === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.folderName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'observation' && item.tag === 'observation') ||
      (activeTab === 'incident' && item.tag === 'incident') ||
      (activeTab === 'autre' && item.tag === 'autre');
    
    return matchesSearch && matchesTab;
  });

  const filteredFolders = folders.filter(folder =>
    searchQuery.trim() === '' || folder.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTagColor = (tag: string) => {
    switch(tag) {
      case 'observation': return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case 'incident': return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case 'autre': return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
        <div className="container flex items-center justify-between h-16">
          {profile && (
            <div className="flex items-center gap-2">
              <Link to="/profiles">
                <Button variant="ghost" size="icon" className="mr-2">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">
                {profile.first_name} {profile.last_name}
              </h1>
            </div>
          )}
          <Button variant="outline" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher une transcription, un mot-clé..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Folder Section with Horizontal Scroll */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Dossiers</h2>
            <FolderDialog profileId={id || ''} />
          </div>
          
          <Carousel className="w-full">
            <CarouselContent>
              {filteredFolders.map((folder) => (
                <CarouselItem key={folder.id} className="md:basis-1/3 lg:basis-1/4">
                  <Card 
                    className={`hover:bg-accent/50 transition-colors cursor-pointer h-full ${
                      selectedFolderId === folder.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => setSelectedFolderId(selectedFolderId === folder.id ? null : folder.id)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">{folder.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">
                          0 fichiers
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Récent
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0" />
            <CarouselNext className="right-0" />
          </Carousel>
        </div>

        {/* Selected Folder Content */}
        {selectedFolderId && (
          <Card className="border border-accent">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {folders.find(f => f.id === selectedFolderId)?.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">Contenu du dossier</p>
              </div>
              <FileUploadDialog folderId={selectedFolderId} />
            </CardHeader>
            <CardContent>
              <FileList folderId={selectedFolderId} />
            </CardContent>
          </Card>
        )}

        {/* Tab Navigation for Transcriptions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Transcriptions</h2>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList>
                <TabsTrigger value="all">Tous</TabsTrigger>
                <TabsTrigger value="observation">Observations</TabsTrigger>
                <TabsTrigger value="incident">Incidents</TabsTrigger>
                <TabsTrigger value="autre">Autres</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Transcriptions List */}
          <div className="space-y-3">
            {filteredTranscriptions.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">Aucune transcription ne correspond à votre recherche</p>
              </Card>
            ) : (
              filteredTranscriptions.map((item) => (
                <Card key={item.id} className="neumorphic overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{item.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {item.date}
                          </span>
                          <Badge className={getTagColor(item.tag)}>
                            {item.tag}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm line-clamp-2">{item.content}</p>
                  </CardContent>
                  <CardFooter className="border-t bg-muted/30 py-2 px-6">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs text-muted-foreground">
                        Dossier : {item.folderName}
                      </span>
                      <div className="flex items-center gap-1">
                        {item.type === 'vocal' ? (
                          <Mic className="h-3 w-3 text-primary" />
                        ) : (
                          <FileText className="h-3 w-3 text-secondary" />
                        )}
                        <span className="text-xs">{item.type === 'vocal' ? 'Transcription vocale' : 'Note textuelle'}</span>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* AI Generated Notes Section */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Notes générées par IA</h2>
          <div className="space-y-3">
            {mockAINotes.map((note) => (
              <Card key={note.id} className="neumorphic overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{note.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {note.date}
                        </span>
                        <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                          IA
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm line-clamp-2">{note.content}</p>
                </CardContent>
                <CardFooter className="border-t bg-muted/30 py-2 px-6">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-muted-foreground">
                      Template : {note.template}
                    </span>
                    <Button variant="link" size="sm" className="text-xs h-auto p-0">
                      Voir le document
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Floating microphone button */}
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
