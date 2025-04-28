
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Calendar, ChevronRight, Search, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GradientButton } from "@/components/ui/GradientButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreateProfileForm } from "@/components/CreateProfileForm";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

export function EnhancedProfilesList({ onSelectProfile }: { onSelectProfile: (id: string) => void }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openCreateProfile, setOpenCreateProfile] = useState(false);

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('young_profiles')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Filtrer les profils en fonction de la recherche
  const filteredProfiles = profiles.filter(
    profile => 
      profile.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fonction pour obtenir les initiales d'une personne
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Fonction pour obtenir une couleur de profil cohérente basée sur le nom
  const getProfileColor = (name: string) => {
    const colors = [
      "from-gensys-primary-from to-gensys-primary-via",
      "from-gensys-primary-via to-gensys-primary-to",
      "from-amber-500 to-orange-500",
      "from-emerald-500 to-teal-500",
      "from-gensys-primary-to to-purple-500",
      "from-cyan-500 to-blue-500"
    ];
    
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className="container mx-auto py-8 px-4 pb-24 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={isLoaded ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4 }}
        className="flex justify-between items-center"
      >
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gensys-primary-from to-gensys-primary-to bg-clip-text text-transparent">
            Mes profils
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gérez vos suivis éducatifs et accédez aux données des jeunes
          </p>
        </div>
        <Dialog open={openCreateProfile} onOpenChange={setOpenCreateProfile}>
          <DialogTrigger asChild>
            <GradientButton aria-label="Créer un nouveau profil">
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>Créer un profil</span>
              </span>
            </GradientButton>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Créer un nouveau profil</DialogTitle>
            </DialogHeader>
            <CreateProfileForm />
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={isLoaded ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="relative w-full max-w-md mx-auto"
      >
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <Input
          type="text"
          placeholder="Rechercher un profil..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4 py-2 rounded-full border-gray-200 bg-white/80 backdrop-blur-sm focus:border-gensys-primary-to focus:ring-gensys-primary-to/20 shadow-sm hover:shadow transition-all duration-300"
        />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredProfiles.map((profile, index) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              onClick={() => onSelectProfile(profile.id)}
            >
              <Card className="relative overflow-hidden border-0 bg-white/80 backdrop-blur-md shadow-lg hover:shadow-xl dark:bg-gray-800/50 rounded-xl p-5 cursor-pointer group transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 -z-10" />
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br ${getProfileColor(`${profile.first_name}${profile.last_name}`)} opacity-10 blur-2xl transform translate-x-8 -translate-y-8 -z-10`} />
                
                <div className="flex items-center gap-4">
                  <Avatar className={`h-14 w-14 rounded-xl shadow-lg bg-gradient-to-br ${getProfileColor(`${profile.first_name}${profile.last_name}`)}`}>
                    <AvatarFallback className="text-white font-medium">
                      {getInitials(profile.first_name || '', profile.last_name || '')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold truncate text-gray-800 dark:text-white group-hover:text-gensys-primary-via dark:group-hover:text-gensys-primary-from transition-colors duration-300">
                      {profile.first_name} {profile.last_name}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <Calendar className="h-3.5 w-3.5 mr-1.5 text-gensys-primary-from" />
                      <span>Créé le • {formatDate(profile.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center transform translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    <ChevronRight className="h-4 w-4 text-gensys-primary-from" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {filteredProfiles.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <UserCircle2 className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
            Aucun profil trouvé
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            {searchQuery 
              ? `Aucun résultat pour "${searchQuery}". Essayez une autre recherche ou créez un nouveau profil.`
              : "Commencez par créer un nouveau profil pour gérer vos suivis éducatifs."}
          </p>
        </motion.div>
      )}
    </div>
  );
}
