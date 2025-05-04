
import { Search } from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { TranscriptionsList } from "./TranscriptionsList";
import { FoldersList } from "./FoldersList";
import { NotesList } from "./NotesList";
import { AnimatedTabs } from "@/components/ui/AnimatedTabs";
import { FileText, MessageSquare, Folder } from "lucide-react";
import { SearchInput } from "@/components/ui/SearchInput";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SearchTabsProps {
  profileId: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedTab: string;
  onTabChange: (value: string) => void;
  selectedFolderId: string | null;
  onFolderSelect: (id: string | null) => void;
}

export function SearchTabs({
  profileId,
  searchQuery,
  onSearchChange,
  selectedTab,
  onTabChange,
  selectedFolderId,
  onFolderSelect,
}: SearchTabsProps) {
  const tabs = [
    { id: "transcriptions", label: "Transcriptions", icon: <MessageSquare className="h-4 w-4" /> },
    { id: "folders", label: "Dossiers", icon: <Folder className="h-4 w-4" /> },
    { id: "ia-notes", label: "Notes IA", icon: <FileText className="h-4 w-4" /> },
  ];

  // Fetch most used titles for transcriptions
  const { data: transcriptionTitles = [] } = useQuery({
    queryKey: ['transcription_titles', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('files')
        .select('name')
        .eq('type', 'transcription')
        .limit(5);
        
      if (error) {
        console.error('Error fetching transcription titles:', error);
        return [];
      }
      return data.map(file => file.name);
    },
    enabled: selectedTab === "transcriptions" && !!profileId,
  });

  // Fetch folder titles
  const { data: folderTitles = [] } = useQuery({
    queryKey: ['folder_titles', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('title')
        .eq('profile_id', profileId)
        .limit(5);
        
      if (error) {
        console.error('Error fetching folder titles:', error);
        return [];
      }
      return data.map(folder => folder.title);
    },
    enabled: selectedTab === "folders" && !!profileId,
  });

  // Fetch note titles
  const { data: noteTitles = [] } = useQuery({
    queryKey: ['note_titles', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('title')
        .eq('user_id', profileId)
        .limit(5);
        
      if (error) {
        console.error('Error fetching note titles:', error);
        return [];
      }
      return data.map(note => note.title);
    },
    enabled: selectedTab === "ia-notes" && !!profileId,
  });

  // Search suggestions based on the current tab and fetched data
  const getSearchSuggestions = () => {
    // Default suggestions if data isn't loaded yet
    const defaultSuggestions = {
      transcriptions: ["Entretien initial", "Suivi mensuel", "Bilan annuel", "Discussion parents", "Évaluation psychologique"],
      folders: ["Dossier médical", "Documents administratifs", "Suivi scolaire", "Activités extrascolaires", "Historique familial"],
      notes: ["Synthèse comportement", "Points forts relevés", "Axes d'amélioration", "Recommandations", "Observations récentes"]
    };

    switch(selectedTab) {
      case "transcriptions":
        return transcriptionTitles.length > 0 ? transcriptionTitles : defaultSuggestions.transcriptions;
      case "folders":
        return folderTitles.length > 0 ? folderTitles : defaultSuggestions.folders;
      case "ia-notes":
        return noteTitles.length > 0 ? noteTitles : defaultSuggestions.notes;
      default:
        return [];
    }
  };

  return (
    <Tabs className="w-full" value={selectedTab} onValueChange={onTabChange}>
      <div className="flex justify-between items-center mb-4 flex-col sm:flex-row gap-4">
        <AnimatedTabs
          tabs={tabs}
          selectedTab={selectedTab}
          onChange={onTabChange}
          className="max-w-md w-full sm:w-auto"
        />
        <div className="w-full sm:max-w-xs">
          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Rechercher..."
            suggestions={getSearchSuggestions()}
            className="w-full"
          />
        </div>
      </div>

      <TabsContent value="transcriptions" className="mt-0">
        <TranscriptionsList 
          profileId={profileId} 
          folderId={selectedFolderId}
          searchQuery={searchQuery}
        />
      </TabsContent>

      <TabsContent value="folders" className="mt-0">
        <FoldersList 
          profileId={profileId} 
          searchQuery={searchQuery}
          onFolderSelect={onFolderSelect}
          selectedFolderId={selectedFolderId}
        />
      </TabsContent>

      <TabsContent value="ia-notes" className="mt-0">
        <NotesList 
          profileId={profileId} 
          searchQuery={searchQuery}
        />
      </TabsContent>
    </Tabs>
  );
}
