
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, FileText, Plus, Layers, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function DashboardHome() {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <>
      <main className="container mx-auto py-8 px-4 max-w-6xl pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isLoaded ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="mb-8 overflow-hidden border-0 bg-white/80 backdrop-blur-xl dark:bg-gray-800/50 shadow-xl rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-gensys-primary-from/5 to-gensys-primary-to/5 rounded-2xl" />
            <div className="absolute inset-x-0 -top-40 -bottom-40 left-2/3 transform -translate-x-1/2 bg-gradient-to-br from-gensys-primary-from/10 via-gensys-primary-via/5 to-gensys-primary-from/5 blur-3xl rounded-full z-0" />
            
            <CardHeader className="relative z-10">
              <div className="flex items-center gap-4 mb-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-gensys-primary-from to-gensys-primary-to flex items-center justify-center shadow-lg">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gensys-primary-from to-gensys-primary-to text-transparent bg-clip-text">
                  Bienvenue sur GENSYS
                </CardTitle>
              </div>
              <CardDescription className="text-lg text-gray-600 dark:text-gray-300 pl-12">
                Gérez vos suivis éducatifs et générez des notes professionnelles avec l'IA
              </CardDescription>
            </CardHeader>
            
            <CardContent className="relative z-10">
              <Button
                variant="default"
                className="group relative overflow-hidden bg-gradient-to-r from-gensys-primary-from to-gensys-primary-to hover:from-gensys-primary-via hover:to-gensys-primary-to text-white rounded-xl shadow-lg hover:shadow-gensys-primary-from/25 transition-all duration-300"
                onClick={() => navigate('/profiles')}
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                <Plus className="h-4 w-4 mr-2" />
                <span>Créer un profil</span>
                <div className="absolute right-2 h-5 w-5 rounded-full bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                  <ArrowRight className="h-3 w-3 text-white" />
                </div>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card 
              className={cn(
                "h-full overflow-hidden border-0 bg-white/80 backdrop-blur-xl dark:bg-gray-800/50 shadow-lg hover:shadow-xl rounded-2xl",
                "group cursor-pointer transition-all duration-500 hover:bg-gradient-to-br hover:from-gensys-primary-from/5 hover:to-gensys-primary-via/5"
              )}
              onClick={() => navigate('/profiles')}
            >
              <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-gradient-to-br from-gensys-primary-from/10 to-gensys-primary-to/5 blur-2xl transform translate-x-20 -translate-y-20 group-hover:scale-150 transition-transform duration-700" />
              
              <div className="h-full flex flex-col items-center justify-center p-8 relative z-10">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-gensys-primary-from to-gensys-primary-to flex items-center justify-center mb-6 shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Users className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2 text-center group-hover:bg-gradient-to-r group-hover:from-gensys-primary-from group-hover:to-gensys-primary-to group-hover:text-transparent group-hover:bg-clip-text transition-all duration-300">
                  Accéder aux profils
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
                  Consultez et gérez tous vos profils de suivis éducatifs en un seul endroit
                </p>
                <div className="mt-6 h-9 flex items-center">
                  <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-gray-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                    <ArrowRight className="h-4 w-4 text-gensys-primary-from dark:text-gensys-primary-from" />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card 
              className={cn(
                "h-full overflow-hidden border-0 bg-white/80 backdrop-blur-xl dark:bg-gray-800/50 shadow-lg hover:shadow-xl rounded-2xl",
                "group cursor-pointer transition-all duration-500 hover:bg-gradient-to-br hover:from-gensys-primary-to/5 hover:to-gensys-primary-from/5"
              )}
              onClick={() => navigate('/templates')}
            >
              <div className="absolute top-0 left-0 h-40 w-40 rounded-full bg-gradient-to-br from-gensys-primary-to/10 to-gensys-primary-from/5 blur-2xl transform -translate-x-20 -translate-y-20 group-hover:scale-150 transition-transform duration-700" />
              
              <div className="h-full flex flex-col items-center justify-center p-8 relative z-10">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-gensys-primary-to to-gensys-primary-from flex items-center justify-center mb-6 shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Layers className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2 text-center group-hover:bg-gradient-to-r group-hover:from-gensys-primary-to group-hover:to-gensys-primary-from group-hover:text-transparent group-hover:bg-clip-text transition-all duration-300">
                  Gérer mes templates
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
                  Créez et personnalisez des modèles pour générer des notes structurées avec l'IA
                </p>
                <div className="mt-6 h-9 flex items-center">
                  <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-gray-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                    <ArrowRight className="h-4 w-4 text-gensys-primary-to dark:text-gensys-primary-to" />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isLoaded ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12"
        >
          <div className="flex flex-col items-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 mb-2">
              <Sparkles className="h-4 w-4 text-gensys-primary-from mr-2" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Propulsé par l'IA</span>
            </div>
            <p className="text-center text-gray-500 dark:text-gray-400 max-w-lg">
              GENSYS utilise l'intelligence artificielle pour vous aider à produire des notes professionnelles
              à partir de vos observations et transcriptions.
            </p>
          </div>
        </motion.div>
      </main>
    </>
  );
}
