
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useYoungProfile(profileId: string) {
  return useQuery({
    queryKey: ['young_profile', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('young_profiles')
        .select('*')
        .eq('id', profileId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        throw new Error(`Erreur de chargement du profil: ${error.message}`);
      }
      return data;
    },
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
