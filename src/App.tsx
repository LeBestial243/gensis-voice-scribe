import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { useAuth } from "@/lib/auth";
import { Suspense, lazy } from "react";
import NotFound from "./pages/NotFound";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// Importation des pages avec lazy loading
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Profiles = lazy(() => import("./pages/Profiles"));
const YoungProfilePage = lazy(() => import("./pages/YoungProfilePage"));
const TemplatesPage = lazy(() => import("./pages/TemplatesPage"));

// Créez un composant de chargement pour les imports lazy
const Loading = () => (
  <div className="h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

// Composant pour les routes protégées
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <Loading />;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// Création du client de requête avec configuration optimisée
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route 
                path="/auth" 
                element={<Auth />} 
              />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profiles" 
                element={
                  <ProtectedRoute>
                    <Profiles />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/young_profiles/:id" 
                element={
                  <ProtectedRoute>
                    <YoungProfilePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/templates" 
                element={
                  <ProtectedRoute>
                    <TemplatesPage />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;