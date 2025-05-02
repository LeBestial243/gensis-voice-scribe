
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useYoungProfile } from "@/hooks/use-young-profile";
import { MobileNav } from "@/components/MobileNav";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { OfficialReportGenerator } from "@/components/young-profile/reports/OfficialReportGenerator";

export default function OfficialReportGeneratorPage() {
  const { profileId } = useParams<{ profileId: string }>();
  
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
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1">
        <Header />
        <div className="container mx-auto py-8 px-4 pb-24">
          <header className="mb-8">
            <h1 className="text-3xl font-bold">
              Générateur de rapports officiels - {profile.first_name} {profile.last_name}
            </h1>
            <p className="text-muted-foreground mt-1">
              Générez des rapports structurés selon les exigences administratives
            </p>
          </header>

          <OfficialReportGenerator profileId={profileId || ""} />
          
          <MobileNav />
        </div>
      </div>
    </div>
  );
}
