import { Route, Routes } from "react-router-dom";
import TemplatesPage from "./pages/TemplatesPage";
import StructuresManagementPage from "./pages/StructuresManagementPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import YoungProfilesPage from "./pages/YoungProfilesPage";
import YoungProfilePage from "./pages/YoungProfilePage";
import NotesPage from "./pages/NotesPage";
import NotePage from "./pages/NotePage";
import ActivityReportsPage from "./pages/ActivityReportsPage";
import ActivityReportPage from "./pages/ActivityReportPage";
import { Toaster } from "./components/ui/toaster";
import { AuthProvider } from "./lib/auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./components/theme-provider";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/young-profiles" element={<YoungProfilesPage />} />
            <Route path="/young-profiles/:id" element={<YoungProfilePage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/notes/:id" element={<NotePage />} />
            <Route path="/activity-reports" element={<ActivityReportsPage />} />
            <Route path="/activity-reports/:id" element={<ActivityReportPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/structures" element={<StructuresManagementPage />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
