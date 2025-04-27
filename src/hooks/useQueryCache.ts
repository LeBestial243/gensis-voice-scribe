
import { useQueryClient } from "@tanstack/react-query";

/**
 * Hook personnalisé pour gérer le cache des requêtes TanStack Query.
 * Fournit des méthodes utilitaires pour optimiser les performances.
 */
export function useQueryCache() {
  const queryClient = useQueryClient();

  /**
   * Précharge les données d'un profil spécifié.
   * @param profileId - L'ID du profil à précharger
   */
  const prefetchProfile = async (profileId: string) => {
    await queryClient.prefetchQuery({
      queryKey: ['young_profile', profileId],
      queryFn: async () => {
        // Cette fonction ne fait rien actuellement
        // Les vraies données seront chargées quand le composant sera monté
        return null;
      },
      staleTime: 60 * 1000, // Considérer comme frais pendant 1 minute
    });
  };

  /**
   * Précharge les dossiers d'un profil spécifique.
   * @param profileId - L'ID du profil dont les dossiers doivent être préchargés
   */
  const prefetchFolders = async (profileId: string) => {
    await queryClient.prefetchQuery({
      queryKey: ['folders', profileId],
      queryFn: async () => {
        // Cette fonction ne fait rien actuellement
        return [];
      },
      staleTime: 30 * 1000, // 30 secondes
    });
  };

  /**
   * Invalide le cache pour un profil spécifique et ses données associées.
   * @param profileId - L'ID du profil à invalider
   */
  const invalidateProfile = async (profileId: string) => {
    await queryClient.invalidateQueries({ queryKey: ['young_profile', profileId] });
    await queryClient.invalidateQueries({ queryKey: ['folders', profileId] });
    await queryClient.invalidateQueries({ queryKey: ['transcriptions', profileId] });
    await queryClient.invalidateQueries({ queryKey: ['notes', profileId] });
  };

  /**
   * Met à jour la configuration globale du cache pour optimiser les performances.
   * Appeler cette fonction au démarrage de l'application.
   */
  const optimizeCacheConfig = () => {
    // Configure des paramètres globaux pour tanstack query
    queryClient.setDefaultOptions({
      queries: {
        staleTime: 30 * 1000, // 30 secondes par défaut
        cacheTime: 5 * 60 * 1000, // 5 minutes
        retry: 1, // Limite les tentatives de réessai
        refetchOnWindowFocus: false, // Désactive le rechargement automatique lors du focus
      },
    });
  };

  /**
   * Mise à jour optimiste du cache pour les mutations (création, mise à jour, suppression)
   */
  const updateCache = (queryKey: any[], updater: (oldData: any) => any) => {
    queryClient.setQueryData(queryKey, (oldData: any) => {
      return updater(oldData);
    });
  };

  return {
    prefetchProfile,
    prefetchFolders,
    invalidateProfile,
    optimizeCacheConfig,
    updateCache,
    queryClient,
  };
}
