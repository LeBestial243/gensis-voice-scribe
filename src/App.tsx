
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/components/ui/sidebar';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Profiles from '@/pages/Profiles';
import YoungProfilePage from '@/pages/YoungProfilePage';
import CriticalIncidentsPage from '@/pages/CriticalIncidentsPage';
import ConfidentialitySettingsPage from '@/pages/ConfidentialitySettingsPage';
import TemplatesPage from '@/pages/TemplatesPage';
import TeamCollaborationPage from '@/pages/TeamCollaborationPage';
import { Profile } from '@/pages/Profile';
import EducationalProjectPage from '@/pages/EducationalProjectPage';
import EducationalProjectGeneratorPage from '@/pages/EducationalProjectGeneratorPage';
import CASFReportsPage from '@/pages/CASFReportsPage';
import NotFound from '@/pages/NotFound';
import { Header } from '@/components/Header';
import { AppSidebar } from '@/components/AppSidebar';
import PriorityDashboardPage from '@/pages/PriorityDashboardPage';
import EmotionalAnalysisPage from '@/pages/EmotionalAnalysisPage';

function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <SidebarProvider>
          <div className="app-container">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profiles" element={<Profiles />} />
              <Route path="/young-profile/:id" element={<YoungProfilePage />} />
              <Route path="/critical-incidents/:id" element={<CriticalIncidentsPage />} />
              <Route path="/confidentiality-settings" element={<ConfidentialitySettingsPage />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/team-collaboration/:profileId?" element={<TeamCollaborationPage />} />
              <Route path="/priority-dashboard" element={<PriorityDashboardPage />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/educational-project/:projectId" element={<EducationalProjectPage />} />
              <Route path="/educational-project-generator/:profileId" element={<EducationalProjectGeneratorPage />} />
              <Route path="/casf-reports/:profileId?" element={<CASFReportsPage />} />
              <Route path="/emotional-analysis/:profileId" element={<EmotionalAnalysisPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </div>
        </SidebarProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
