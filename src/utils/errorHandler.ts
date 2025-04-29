
import { useToast } from "@/hooks/use-toast";

// Types d'erreurs personnalisées
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'unknown_error',
    public readonly status: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Fonction pour formater les erreurs Supabase
export function formatSupabaseError(error: any): AppError {
  console.error("Supabase error:", error);
  
  // Gérer les erreurs Supabase connues
  if (error.code === 'PGRST116') {
    return new AppError('Ressource non trouvée', 'not_found', 404);
  }
  
  if (error.code === '23505') {
    return new AppError('Cet élément existe déjà', 'already_exists', 409);
  }
  
  if (error.code === '42501') {
    return new AppError('Permission refusée', 'permission_denied', 403);
  }
  
  // Erreur par défaut
  return new AppError(
    error.message || 'Une erreur est survenue', 
    error.code || 'unknown_error',
    error.status || 400
  );
}

// Hook pour gérer les erreurs de manière cohérente
export function useErrorHandler() {
  const { toast } = useToast();
  
  const handleError = (error: unknown, customMessage?: string) => {
    console.error('Error caught:', error);
    
    // Formater le message d'erreur
    let errorMessage = customMessage || 'Une erreur est survenue';
    let errorCode = 'unknown_error';
    
    if (error instanceof AppError) {
      errorMessage = error.message;
      errorCode = error.code;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    // Afficher un toast
    toast({
      title: "Erreur",
      description: errorMessage,
      variant: "destructive",
    });
    
    // Retourner l'erreur formatée pour un traitement supplémentaire
    return { message: errorMessage, code: errorCode };
  };
  
  return { handleError };
}
