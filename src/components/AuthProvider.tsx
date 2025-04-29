import { useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Fonction pour gérer les changements d'état d'authentification
    const handleAuthChange = (event: string, currentSession: Session | null) => {
      // Mettre à jour l'état avec la session et l'utilisateur
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      // Afficher les notifications appropriées en fonction de l'événement
      if (event === 'SIGNED_OUT') {
        toast({ title: 'Déconnexion réussie' });
      } else if (event === 'SIGNED_IN') {
        toast({ title: 'Connexion réussie' });
      }
    };

    // Vérifier d'abord la session existante
    const fetchInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        // Mettre à jour l'état avec la session initiale
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (error) {
        console.error('Erreur lors de la récupération de la session initiale:', error);
      } finally {
        // Marquer le chargement comme terminé
        setLoading(false);
      }
    };

    // Mettre en place l'écouteur d'événements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    // Récupérer la session initiale
    fetchInitialSession();

    // Nettoyer l'abonnement lors du démontage du composant
    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  return (
    <AuthContext.Provider value={{ session, user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}