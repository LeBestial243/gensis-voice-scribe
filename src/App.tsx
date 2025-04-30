
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Profiles from "./pages/Profiles";
import YoungProfilePage from "./pages/YoungProfilePage";
import TemplatesPage from "./pages/TemplatesPage";
import CASFReportsPage from "./pages/CASFReportsPage";
import EducationalProjectPage from "./pages/EducationalProjectPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profiles" element={<Profiles />} />
            <Route path="/young_profiles/:id" element={<YoungProfilePage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/casf/reports" element={<CASFReportsPage />} />
            <Route path="/educational-projects/:id" element={<EducationalProjectPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
