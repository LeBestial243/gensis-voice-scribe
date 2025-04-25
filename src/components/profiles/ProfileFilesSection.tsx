
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileList } from "@/components/FileList";
import { FileUploadDialog } from "@/components/FileUploadDialog";
import { FolderDialog } from "@/components/FolderDialog";

interface ProfileFilesSectionProps {
  selectedProfileId: string;
}

export function ProfileFilesSection({ selectedProfileId }: ProfileFilesSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const { data: folders = [] } = useQuery({
    queryKey: ['folders', selectedProfileId],
    queryFn: async () => {
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

  return (
    <>
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-sm bg-muted rounded-xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher un dossier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-0 shadow-none bg-transparent"
          />
        </div>
        <FolderDialog profileId={selectedProfileId} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFolders.map((folder) => (
          <Card 
            key={folder.id} 
            className={`cursor-pointer interactive ${
              selectedFolderId === folder.id ? 'bg-accent/10 shadow-md' : ''
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
                <Badge variant="outline">
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
    </>
  );
}
