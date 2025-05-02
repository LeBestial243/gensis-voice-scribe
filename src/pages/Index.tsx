
import { useState } from "react";
import { useAuth, useRequireAuth } from "@/lib/auth";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { DashboardHome } from "@/components/DashboardHome";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const Index = () => {
  const isMobile = useIsMobile();
  const { loading } = useRequireAuth();

  if (loading) {
    return <div className="h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>;
  }

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <AppSidebar />
      <div className="flex-1">
        <Header />
        <DashboardHome />
        {isMobile && <MobileNav className="animate-slide-up" />}
      </div>
    </div>
  );
}

export default Index;
