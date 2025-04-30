
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useErrorHandler } from "@/utils/errorHandler";

export function useYoungProfile(profileId: string) {
  const { handleError } = useErrorHandler();
  
  return useQuery({
    queryKey: ['young_profile', profileId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('young_profiles')
          .select('*')
          .eq('id', profileId)
          .single();
        
        if (error) throw error;
        return data;
      } catch (error) {
        throw handleError(error, "Chargement du profil", false).message;
      }
    },
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    meta: {
      onError: (error: unknown) => {
        handleError(error, "Chargement du profil");
      }
    }
  });
}
