
import { useState } from "react";
import { useParams } from "react-router-dom";
import { EmotionalAnalysis } from "@/components/young-profile/emotional-analysis/EmotionalAnalysis";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useYoungProfile } from "@/hooks/use-young-profile";
import { MobileNav } from "@/components/MobileNav";
import { FileList } from "@/components/FileList";

export default function EmotionalAnalysisPage() {
  const { profileId } = useParams<{ profileId: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: profile, isLoading } = useYoungProfile(profileId || "");

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="pt-6">
            <p>Le profil demandé n'a pas été trouvé.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">
          Analyse émotionnelle - {profile.first_name} {profile.last_name}
        </h1>
        <p className="text-muted-foreground mt-1">
          Visualisation et analyse de l'évolution émotionnelle basée sur les transcriptions
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EmotionalAnalysis profileId={profileId || ""} />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Transcriptions</h2>
          <FileList
            profileId={profileId || ""}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            fileType="transcription"
          />
        </div>
      </div>
      
      <MobileNav />
    </div>
  );
}
