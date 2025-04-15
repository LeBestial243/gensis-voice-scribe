
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { TranscriptionsList } from "@/components/TranscriptionsList";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1">
          {isMobile && <Header />}
          <main className="container mx-auto py-6 px-4 md:px-6 max-w-4xl">
            <h1 className="text-2xl md:text-3xl font-bold mb-6">
              Transformez votre voix en documents professionnels
            </h1>
            
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">Enregistrer votre voix</h2>
              <VoiceRecorder />
            </section>
            
            <section>
              <TranscriptionsList />
            </section>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
