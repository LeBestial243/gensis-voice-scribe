
import { useState } from "react";
import { useAuth, useRequireAuth } from "@/lib/auth";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { TranscriptionsList } from "@/components/TranscriptionsList";
import { MobileNav } from "@/components/MobileNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Flag, LogOut } from "lucide-react";
import { IncidentReportDialog } from "@/components/IncidentReportDialog";

const Index = () => {
  const isMobile = useIsMobile();
  const { loading } = useRequireAuth();
  const { user } = useAuth();
  const [transcriptionInProgress, setTranscriptionInProgress] = useState(false);
  const [isIncidentDialogOpen, setIsIncidentDialogOpen] = useState(false);

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Chargement...</div>;
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleTranscriptionComplete = (text: string, audioURL: string | null) => {
    // For the Index page, we could update the transcriptions list or show a notification
    console.log("Transcription completed:", text);
    setTranscriptionInProgress(false);
  };

  const handleTranscriptionStart = () => {
    setTranscriptionInProgress(true);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1">
          {isMobile && <Header />}
          <main className="container mx-auto py-6 px-4 md:px-6 max-w-4xl pb-24">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#36D1DC] to-[#5B86E5] bg-clip-text text-transparent">
                Transformez votre voix en documents professionnels
              </h1>
              <Button variant="ghost" onClick={handleSignOut} size="icon">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
            
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">Enregistrer votre voix</h2>
              <div className="neumorphic rounded-2xl p-6">
                <VoiceRecorder 
                  onTranscriptionComplete={handleTranscriptionComplete}
                  onTranscriptionStart={handleTranscriptionStart}
                />
              </div>
            </section>
            
            <section className="neumorphic rounded-2xl p-6">
              <TranscriptionsList />
            </section>
          </main>
          {isMobile && <MobileNav className="animate-slide-up" />}
        </div>
      </div>

      {/* Floating Incident Report Button */}
      <Button
        onClick={() => setIsIncidentDialogOpen(true)}
        className="fixed bottom-8 right-8 rounded-full h-14 w-14 shadow-lg flex items-center justify-center animate-pulse hover:animate-none z-50"
        size="icon"
        variant="default"
      >
        <Flag className="h-6 w-6" />
      </Button>

      {/* Incident Report Dialog */}
      <IncidentReportDialog 
        open={isIncidentDialogOpen} 
        onOpenChange={setIsIncidentDialogOpen}
      />
    </SidebarProvider>
  );
};

export default Index;
