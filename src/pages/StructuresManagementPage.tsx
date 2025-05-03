
import { useState } from "react";
import { Header } from "@/components/Header";
import { StructuresManagement } from "@/components/structures/StructuresManagement";
import { StructureUsersManagement } from "@/components/structures/StructureUsersManagement";
import { AppSidebar } from "@/components/AppSidebar";
import { useRequireAuth } from "@/lib/auth";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MobileNav } from "@/components/MobileNav";
import { useIsMobile } from "@/hooks/use-mobile";

export default function StructuresManagementPage() {
  const { loading } = useRequireAuth();
  const isMobile = useIsMobile();
  const [selectedStructure, setSelectedStructure] = useState<{ id: string, name: string } | null>(null);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neumorph-accent"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 container py-8">
            {selectedStructure ? (
              <StructureUsersManagement
                structureId={selectedStructure.id}
                structureName={selectedStructure.name}
                onBack={() => setSelectedStructure(null)}
              />
            ) : (
              <StructuresManagement
                onManageUsers={(structureId, structureName) => setSelectedStructure({ id: structureId, name: structureName })}
              />
            )}
          </main>
          {isMobile && <MobileNav className="animate-slide-up" />}
        </div>
      </div>
    </SidebarProvider>
  );
}
