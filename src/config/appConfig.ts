
// Configuration générale de l'application
const appConfig = {
  // URLs et points d'accès API
  api: {
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL || "https://ulhlmrjyjhrgktncggav.supabase.co",
      key: import.meta.env.VITE_SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsaGxtcmp5amhyZ2t0bmNnZ2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDIwMjIsImV4cCI6MjA2MDMxODAyMn0.cfcu8PaKMNwtDQpprE4pLlSk-mEb5Acl7P--Tyq0XTc",
    },
  },
  
  // Paramètres de l'application
  app: {
    name: "GENSYS - Voice Scribe",
    description: "Transformez votre voix en documents professionnels structurés",
    company: "GENSYS",
    logo: {
      main: "https://ulhlmrjyjhrgktncggav.supabase.co/storage/v1/object/sign/logo/GenSys%20finale.svg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzBjMjg3MTBiLTZhNWMtNDJjNC04ZWJjLWFkMGM2YzYyNDZmMiJ9.eyJ1cmwiOiJsb2dvL0dlblN5cyBmaW5hbGUuc3ZnIiwiaWF0IjoxNzQ1ODY4MzExLCJleHAiOjE3Nzc0MDQzMTF9.dZaZ2t7-73UWm13qTLYzeWWbkBWM4TM9CY9kb8wDTzU"
    },
  },
  
  // Constantes pour les requêtes
  query: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  },
  
  // Limites et contraintes
  limits: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxUploadFiles: 10,
    paginationSize: 10,
  }
};

export default appConfig;
