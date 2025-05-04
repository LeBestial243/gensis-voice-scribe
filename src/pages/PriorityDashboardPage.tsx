
import { useState } from 'react';
import { PriorityDashboard } from '@/components/critical-incidents/PriorityDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MobileNav } from '@/components/MobileNav';
import { motion } from 'framer-motion';

export default function PriorityDashboardPage() {
  const [activeTab, setActiveTab] = useState("all");
  
  return (
    <div className="container py-8 pb-24">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gensys-primary-from to-gensys-primary-to bg-clip-text text-transparent">
          Tableau de bord des priorités
        </h1>
        <p className="text-muted-foreground mt-1">
          Suivez les profils prioritaires, incidents récents et échéances à venir
        </p>
      </motion.div>

      <Tabs defaultValue="all" className="space-y-6" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Vue générale</TabsTrigger>
          <TabsTrigger value="profiles">Profils prioritaires</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="deadlines">Échéances</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <PriorityDashboard />
        </TabsContent>
        
        <TabsContent value="profiles">
          <Card>
            <CardHeader>
              <CardTitle>Profils prioritaires détaillés</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Vue détaillée des profils à venir dans une prochaine mise à jour...</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="incidents">
          <Card>
            <CardHeader>
              <CardTitle>Journal des incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Journal complet des incidents à venir dans une prochaine mise à jour...</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="deadlines">
          <Card>
            <CardHeader>
              <CardTitle>Planificateur d'échéances</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Planificateur complet à venir dans une prochaine mise à jour...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <MobileNav />
    </div>
  );
}
