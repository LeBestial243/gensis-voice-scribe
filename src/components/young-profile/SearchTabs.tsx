
import { Search } from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { TranscriptionsList } from "./TranscriptionsList";
import { FoldersList } from "./FoldersList";
import { NotesList } from "./NotesList";
import { AnimatedTabs } from "@/components/ui/AnimatedTabs";
import { FileText, MessageSquare, Folder } from "lucide-react";
import { SearchInput } from "@/components/ui/SearchInput";

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

  // Search suggestions based on the current tab
  const getSearchSuggestions = () => {
    switch(selectedTab) {
      case "transcriptions":
        return ["Entretien initial", "Suivi mensuel", "Bilan annuel", "Discussion parents", "Évaluation psychologique"];
      case "folders":
        return ["Dossier médical", "Documents administratifs", "Suivi scolaire", "Activités extrascolaires", "Historique familial"];
      case "ia-notes":
        return ["Synthèse comportement", "Points forts relevés", "Axes d'amélioration", "Recommandations", "Observations récentes"];
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
