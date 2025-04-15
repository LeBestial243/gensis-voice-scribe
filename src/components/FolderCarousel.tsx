
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUploadDialog } from "@/components/FileUploadDialog";
import { FileList } from "@/components/FileList";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface FolderCarouselProps {
  folders: Array<{
    id: string;
    title: string;
    created_at: string;
  }>;
  searchQuery: string;
}

export function FolderCarousel({ folders, searchQuery }: FolderCarouselProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const filteredFolders = folders.filter((folder) =>
    folder.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      className="w-full"
    >
      <CarouselContent className="-ml-4">
        {filteredFolders.map((folder) => (
          <CarouselItem key={folder.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
            <Card 
              className={`hover:bg-accent/50 transition-colors cursor-pointer ${
                selectedFolderId === folder.id ? 'bg-accent' : ''
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
                  <Badge variant="secondary">
                    0 fichiers
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Dernière modification {format(new Date(folder.created_at), "PPP", { locale: fr })}
                </p>
                {selectedFolderId === folder.id && (
                  <div className="mt-4">
                    <FileList folderId={folder.id} />
                  </div>
                )}
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
