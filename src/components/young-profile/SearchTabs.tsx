
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { TranscriptionsList } from "./TranscriptionsList";
import { FoldersList } from "./FoldersList";
import { NotesList } from "./NotesList";
import { AnimatedTabs } from "@/components/ui/AnimatedTabs";
import { FileText, MessageSquare, Folder } from "lucide-react";

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

  return (
    <Tabs className="w-full" value={selectedTab} onValueChange={onTabChange}>
      <div className="flex justify-between items-center mb-4">
        <AnimatedTabs
          tabs={tabs}
          selectedTab={selectedTab}
          onChange={onTabChange}
          className="max-w-md"
        />
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
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
