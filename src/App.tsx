
import { Route, Routes } from "react-router-dom";
import TemplatesPage from "./pages/TemplatesPage";
import StructuresManagementPage from "./pages/StructuresManagementPage";
import { Toaster } from "./components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./components/ui/ThemeProvider";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <Routes>
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/structures" element={<StructuresManagementPage />} />
        </Routes>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
