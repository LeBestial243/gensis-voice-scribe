import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomPagination } from "./CustomPagination";
import { MorphCard } from "@/components/ui/MorphCard";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const PROFILES_PER_PAGE = 6;

export function ProfileList({ onSelectProfile }: { onSelectProfile?: (id: string) => void }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);

  const { data: totalCount = 0 } = useQuery({
    queryKey: ['profiles_count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('young_profiles')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    }
  });

  const totalPages = Math.ceil(totalCount / PROFILES_PER_PAGE);

  const { data: profiles, isLoading, error } = useQuery({
    queryKey: ['profiles', currentPage, PROFILES_PER_PAGE],
    queryFn: async () => {
      const from = (currentPage - 1) * PROFILES_PER_PAGE;
      const to = from + PROFILES_PER_PAGE - 1;
      
      const { data, error } = await supabase
        .from('young_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return data;
    },
  });

  const handleProfileClick = (id: string) => {
    if (onSelectProfile) {
      onSelectProfile(id);
    } else {
      navigate(`/young_profiles/${id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground">Chargement des profils...</p>
      </div>
    );
  }

  if (error) {
    toast({
      title: "Erreur",
      description: "Impossible de charger les profils",
      variant: "destructive"
    });
    return <p>Erreur lors du chargement des profils.</p>;
  }

  if (!profiles || profiles.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/50">
        <p className="text-muted-foreground mb-4">Aucun profil trouvé</p>
        <p className="text-sm">Créez un nouveau profil pour commencer</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {profiles.map((profile, index) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                delay: index * 0.05
              }}
            >
              <MorphCard 
                key={profile.id} 
                className="bg-[#F0F4FF] group relative"
                interactive
                onClick={() => handleProfileClick(profile.id)}
              >
                <CardHeader>
                  <CardTitle className="text-xl font-bold tracking-tight text-gray-800 font-dmsans">
                    {profile.first_name} {profile.last_name}
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-500 font-dmsans">
                    {profile.structure || "Aucune structure"} • 
                    {new Date(profile.arrival_date).toLocaleDateString('fr-FR')}
                  </CardDescription>
                </CardHeader>
                
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-gensys-primary-from to-gensys-primary-to scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </MorphCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <CustomPagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </motion.div>
    </div>
  );
}
