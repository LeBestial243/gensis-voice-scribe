
import { useState } from 'react';
import { Edit, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUploadDialog } from "@/components/FileUploadDialog";
import { FileList } from "@/components/FileList";
import { FolderDialog } from "@/components/FolderDialog";
import { GenerateNoteDialog } from "@/components/young-profile/GenerateNoteDialog";
import { FoldersList } from "@/components/young-profile/FoldersList";

interface ProfileContentProps {
  profileId: string;
  firstName?: string;
  lastName?: string;
  onBack: () => void;
}

export function ProfileContent({ profileId, firstName, lastName, onBack }: ProfileContentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isGenerateNoteOpen, setIsGenerateNoteOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
        <div className="container flex items-center justify-between h-16">
          <h1 className="text-2xl font-bold">
            {firstName} {lastName}
          </h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={onBack}
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
          <FolderDialog profileId={profileId} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FoldersList
            profileId={profileId}
            searchQuery={searchQuery}
            onFolderSelect={setSelectedFolderId}
            selectedFolderId={selectedFolderId}
          />
        </div>
      </main>

      <Button
        className="fixed bottom-24 right-4 bg-purple-600 hover:bg-purple-700 animate-pulse hover:animate-none"
        size="lg"
        onClick={() => setIsGenerateNoteOpen(true)}
      >
        Générer une note IA
      </Button>

      <GenerateNoteDialog
        open={isGenerateNoteOpen}
        onOpenChange={setIsGenerateNoteOpen}
        profileId={profileId}
      />
    </>
  );
}
