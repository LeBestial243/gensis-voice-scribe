import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ArrowUp, ArrowDown, Calendar, Clock, Bell } from 'lucide-react';
import { useIncidentAnalysis } from '@/hooks/useIncidentAnalysis';
import { useToast } from '@/hooks/use-toast';
import { teamCollaborationService } from '@/services/teamCollaborationService';
import { CriticalIncident } from '@/types/incidents';
import { supabase } from '@/integrations/supabase/client';

interface PriorityProfile {
  id: string;
  name: string;
  priority: 'high' | 'medium' | 'low';
  incidents: number;
  lastIncident?: string;
  trend: 'up' | 'down' | 'stable';
}

interface Deadline {
  id: string;
  title: string;
  dueDate: string;
  type: 'report' | 'meeting' | 'follow-up';
  profileId?: string;
  profileName?: string;
}

export function PriorityDashboard({ profileId }: { profileId?: string }) {
  const [priorityProfiles, setPriorityProfiles] = useState<PriorityProfile[]>([]);
  const [recentIncidents, setRecentIncidents] = useState<CriticalIncident[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<Deadline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { incidents } = useIncidentAnalysis(profileId || '');

  // Fetch data when component mounts
  useEffect(() => {
    const fetchPriorityData = async () => {
      try {
        setIsLoading(true);
        
        // Get recent activities from teamCollaborationService
        const activities = profileId 
          ? await teamCollaborationService.getActivities(profileId)
          : [];
          
        // Get profiles with incidents
        const { data: profiles } = await supabase
          .from('young_profiles')
          .select('id, first_name, last_name')
          .limit(5);
          
        // Create mock priority profiles based on real profiles
        const mockPriorityProfiles: PriorityProfile[] = (profiles || []).map((profile, index) => {
          const firstName = profile.first_name || '';
          const lastName = profile.last_name || '';
          const fullName = `${firstName} ${lastName}`.trim();
          const priority = index % 3 === 0 ? 'high' : index % 2 === 0 ? 'medium' : 'low';
          
          return {
            id: profile.id,
            name: fullName,
            priority: priority as 'high' | 'medium' | 'low',
            incidents: Math.floor(Math.random() * 5) + (priority === 'high' ? 3 : 0),
            lastIncident: new Date(Date.now() - Math.floor(Math.random() * 7) * 86400000).toISOString(),
            trend: index % 3 === 0 ? 'up' : index % 2 === 0 ? 'stable' : 'down'
          };
        });
        
        // Generate mock deadlines
        const mockDeadlines: Deadline[] = [
          {
            id: '1',
            title: 'Rapport d\'évaluation trimestriel',
            dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
            type: 'report'
          },
          {
            id: '2',
            title: 'Réunion d\'équipe',
            dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
            type: 'meeting'
          },
          {
            id: '3',
            title: 'Suivi psychologique',
            dueDate: new Date(Date.now() + 1 * 86400000).toISOString(),
            type: 'follow-up',
            profileId: profiles?.[0]?.id,
            profileName: `${profiles?.[0]?.first_name || ''} ${profiles?.[0]?.last_name || ''}`
          }
        ];
        
        setPriorityProfiles(mockPriorityProfiles);
        setRecentIncidents(incidents.slice(0, 5));
        setUpcomingDeadlines(mockDeadlines);
      } catch (error) {
        console.error('Error fetching priority data:', error);
        toast({
          title: 'Erreur de chargement',
          description: 'Impossible de charger les données de priorité',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPriorityData();
  }, [profileId, toast, incidents]);
  
  const handleProfileClick = (id: string) => {
    navigate(`/young-profile/${id}`);
  };
  
  const handleIncidentClick = (profileId: string) => {
    navigate(`/critical-incidents/${profileId}`);
  };
  
  return (
    <div className="priority-dashboard space-y-6">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {/* Priority Profiles */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-rose-100 to-rose-50 dark:from-rose-900/20 dark:to-rose-800/20">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              Profils prioritaires
            </CardTitle>
            <CardDescription>
              Profils nécessitant une attention immédiate
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-3">
                {priorityProfiles.map(profile => (
                  <li key={profile.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition cursor-pointer" onClick={() => handleProfileClick(profile.id)}>
                    <div className="flex items-center gap-3">
                      <div className={`
                        h-10 w-10 rounded-full flex items-center justify-center text-white
                        ${profile.priority === 'high' ? 'bg-rose-500' : 
                          profile.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}
                      `}>
                        {profile.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{profile.name}</p>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <span>{profile.incidents} incidents</span>
                          {profile.trend === 'up' && <ArrowUp className="h-3 w-3 text-rose-500" />}
                          {profile.trend === 'down' && <ArrowDown className="h-3 w-3 text-emerald-500" />}
                        </div>
                      </div>
                    </div>
                    <Badge variant={
                      profile.priority === 'high' ? 'destructive' : 
                      profile.priority === 'medium' ? 'default' : 'outline'
                    }>
                      {profile.priority === 'high' ? 'Urgent' : 
                       profile.priority === 'medium' ? 'À suivre' : 'Stable'}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            {!isLoading && priorityProfiles.length === 0 && (
              <p className="text-center py-6 text-muted-foreground">
                Aucun profil prioritaire
              </p>
            )}
            <div className="mt-4">
              <Button variant="outline" className="w-full" onClick={() => navigate('/profiles')}>
                Voir tous les profils
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Incidents */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/20 dark:to-amber-800/20">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-500" />
              Incidents récents
            </CardTitle>
            <CardDescription>
              Incidents des dernières 48 heures
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-3">
                {recentIncidents.map(incident => (
                  <li key={incident.id} className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition cursor-pointer" onClick={() => handleIncidentClick(incident.transcriptionId || '')}>
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{incident.title}</h4>
                      <Badge variant={
                        incident.severity === 'high' ? 'destructive' : 
                        incident.severity === 'medium' ? 'default' : 'outline'
                      }>
                        {incident.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{incident.description}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(incident.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {!isLoading && recentIncidents.length === 0 && (
              <p className="text-center py-6 text-muted-foreground">
                Aucun incident récent
              </p>
            )}
            <div className="mt-4">
              <Button variant="outline" className="w-full" onClick={() => navigate('/critical-incidents')}>
                Voir tous les incidents
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Upcoming Deadlines */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/20 dark:to-blue-800/20">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Échéances à venir
            </CardTitle>
            <CardDescription>
              Rapports, réunions et suivis à préparer
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-3">
                {upcomingDeadlines.map(deadline => {
                  const dueDate = new Date(deadline.dueDate);
                  const daysUntil = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const isUrgent = daysUntil <= 1;
                  
                  return (
                    <li key={deadline.id} className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{deadline.title}</h4>
                        <Badge variant={isUrgent ? 'destructive' : 'outline'} className="font-normal">
                          {daysUntil === 0 ? "Aujourd'hui" : 
                           daysUntil === 1 ? "Demain" : 
                           `Dans ${daysUntil} jours`}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <Clock className="h-3 w-3" />
                        <span>{dueDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                        {deadline.profileName && (
                          <>
                            <span className="mx-1">•</span>
                            <span className="text-sm font-medium">{deadline.profileName}</span>
                          </>
                        )}
                      </div>
                      <Badge variant="secondary" className="mt-2">
                        {deadline.type === 'report' ? 'Rapport' : 
                         deadline.type === 'meeting' ? 'Réunion' : 'Suivi'}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
            {!isLoading && upcomingDeadlines.length === 0 && (
              <p className="text-center py-6 text-muted-foreground">
                Aucune échéance à venir
              </p>
            )}
            <div className="mt-4">
              <Button variant="outline" className="w-full">
                Gérer les échéances
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
