
import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ui/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import Index from "./pages/Index";
import { SidebarProvider } from "./components/ui/sidebar";
import { Profile } from "./pages/Profile";
import NotFound from "./pages/NotFound";
import ConfidentialitySettingsPage from "./pages/ConfidentialitySettingsPage";
import Auth from "./pages/Auth";
import { AuthProvider } from "./components/AuthProvider";
import Profiles from "./pages/Profiles";
import CriticalIncidentsPage from "./pages/CriticalIncidentsPage";
import PriorityDashboardPage from "./pages/PriorityDashboardPage";
import TeamCollaborationPage from "./pages/TeamCollaborationPage";
import TemplatesPage from "./pages/TemplatesPage";
import YoungProfilePage from "./pages/YoungProfilePage";
import CASFReportsPage from "./pages/CASFReportsPage";
import EducationalProjectPage from "./pages/EducationalProjectPage";
import EducationalProjectGeneratorPage from "./pages/EducationalProjectGeneratorPage";
import EmotionalAnalysisPage from "./pages/EmotionalAnalysisPage";
import OfficialReportGeneratorPage from "./pages/OfficialReportGeneratorPage";
import UnifiedReportPage from "./pages/UnifiedReportPage";

export default function App() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profiles" element={<Profiles />} />
            <Route path="/young-profile/:profileId" element={<YoungProfilePage />} />
            <Route path="/confidentiality-settings" element={<ConfidentialitySettingsPage />} />
            <Route path="/critical-incidents" element={<CriticalIncidentsPage />} />
            <Route path="/priority-dashboard" element={<PriorityDashboardPage />} />
            <Route path="/team-collaboration" element={<TeamCollaborationPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/casf-reports" element={<CASFReportsPage />} />
            <Route path="/educational-project/:projectId" element={<EducationalProjectPage />} />
            <Route path="/educational-project-generator/:profileId" element={<EducationalProjectGeneratorPage />} />
            <Route path="/emotional-analysis/:profileId" element={<EmotionalAnalysisPage />} />
            <Route path="/official-report/:profileId" element={<OfficialReportGeneratorPage />} />
            <Route path="/unified-report" element={<UnifiedReportPage />} />
            <Route path="/unified-report/:profileId" element={<UnifiedReportPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}
