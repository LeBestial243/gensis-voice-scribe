
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
import EducationalProjectGeneratorPage from "./pages/EducationalProjectGeneratorPage";
import ConfidentialitySettingsPage from "./pages/ConfidentialitySettingsPage";
import CriticalIncidentsPage from './pages/CriticalIncidentsPage';

const queryClient = new QueryClient();

function App() {
  return (
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
              
              {/* Routes CASF */}
              <Route path="/casf-reports" element={<CASFReportsPage />} />
              <Route path="/young_profiles/:id/projects" element={<EducationalProjectPage />} />
              <Route path="/young_profiles/:id/projects/:projectId" element={<EducationalProjectPage />} />
              <Route path="/young_profiles/:id/generate-project" element={<EducationalProjectGeneratorPage />} />
              <Route path="/confidentiality" element={<ConfidentialitySettingsPage />} />
              
              <Route path="/young-profile/:id/incidents" element={<CriticalIncidentsPage />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
