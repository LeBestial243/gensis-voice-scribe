import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { teamCollaborationService, SharedNote, TeamMember, Activity, Comment } from '@/services/teamCollaborationService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, MessageSquare, Calendar, Clock, Edit, Share, User } from 'lucide-react';

interface TeamCollaborationProps {
  profileId: string;
}

export function TeamCollaboration({ profileId }: TeamCollaborationProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  
  // Query for team members
  const { data: team = [], isLoading: teamLoading } = useQuery({
    queryKey: ['team-members', profileId],
    queryFn: () => teamCollaborationService.getTeamMembers(profileId),
  });
  
  // Query for shared notes
  const { data: sharedNotes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['shared-notes', profileId],
    queryFn: () => teamCollaborationService.getSharedNotes(profileId),
  });
  
  // Query for activities
  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ['team-activities', profileId],
    queryFn: () => teamCollaborationService.getActivities(profileId),
  });
  
  // Set up real-time updates
  useEffect(() => {
    const unsubscribe = teamCollaborationService.setupRealtimeSubscription(
      profileId,
      () => {
        queryClient.invalidateQueries({ queryKey: ['shared-notes', profileId] });
        queryClient.invalidateQueries({ queryKey: ['team-activities', profileId] });
      }
    );
    
    return unsubscribe;
  }, [profileId, queryClient]);
  
  // Mutation for adding comments
  const addCommentMutation = useMutation({
    mutationFn: async ({ sharedNoteId, content, userName }: { sharedNoteId: string; content: string; userName: string }) => {
      return teamCollaborationService.addComment(
        sharedNoteId,
        user?.id || 'anonymous',
        content,
        userName
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-notes', profileId] });
      queryClient.invalidateQueries({ queryKey: ['team-activities', profileId] });
      toast({
        title: 'Commentaire ajouté',
        description: 'Votre commentaire a été ajouté avec succès.',
      });
      setNewComment({});
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter le commentaire.',
        variant: 'destructive',
      });
      console.error('Error adding comment:', error);
    },
  });
  
  // Mutation for updating notes
  const updateNoteMutation = useMutation({
    mutationFn: async ({ noteId, updates }: { noteId: string; updates: Partial<SharedNote> }) => {
      return teamCollaborationService.updateSharedNote(noteId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-notes', profileId] });
      queryClient.invalidateQueries({ queryKey: ['team-activities', profileId] });
      toast({
        title: 'Note mise à jour',
        description: 'La note a été mise à jour avec succès.',
      });
      setEditingNote(null);
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la note.',
        variant: 'destructive',
      });
      console.error('Error updating note:', error);
    },
  });
  
  const handleCommentSubmit = (sharedNoteId: string) => {
    if (!newComment[sharedNoteId]?.trim()) return;
    
    // Find the user's name, or use a placeholder
    const userName = user?.email?.split('@')[0] || 'Team Member';
    
    addCommentMutation.mutate({
      sharedNoteId,
      content: newComment[sharedNoteId],
      userName,
    });
  };
  
  const startEditing = (note: SharedNote) => {
    setEditingNote(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };
  
  const saveNoteEdit = (noteId: string) => {
    if (!editTitle.trim()) return;
    
    updateNoteMutation.mutate({
      noteId,
      updates: {
        title: editTitle,
        content: editContent,
      },
    });
  };
  
  const cancelEditing = () => {
    setEditingNote(null);
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };
  
  // Get action icon
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'added_note':
        return <MessageSquare className="h-4 w-4 mr-1" />;
      case 'commented':
        return <MessageSquare className="h-4 w-4 mr-1" />;
      case 'edited':
        return <Edit className="h-4 w-4 mr-1" />;
      case 'viewed':
        return <User className="h-4 w-4 mr-1" />;
      default:
        return <Calendar className="h-4 w-4 mr-1" />;
    }
  };
  
  return (
    <div className="team-collaboration space-y-6">
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
          <TabsTrigger value="notes">Notes partagées</TabsTrigger>
          <TabsTrigger value="team">Équipe</TabsTrigger>
        </TabsList>
        
        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Équipe éducative</CardTitle>
                <CardDescription>Membres actifs et leur statut</CardDescription>
              </CardHeader>
              <CardContent>
                {teamLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {team.slice(0, 5).map((member) => (
                      <div key={member.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar>
                              <AvatarImage src={member.avatar_url} alt={member.full_name} />
                              <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
                            </Avatar>
                            <span 
                              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(member.status)}`}
                              title={`Statut: ${member.status}`}
                            ></span>
                          </div>
                          <div>
                            <p className="font-medium">{member.full_name}</p>
                            <p className="text-xs text-muted-foreground">{member.role}</p>
                          </div>
                        </div>
                        <Badge variant={member.status === 'online' ? 'default' : 'outline'}>
                          {member.status === 'online' ? 'En ligne' : 'Hors ligne'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="w-full">
                  Voir tous les membres
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>Activités récentes</CardTitle>
                <CardDescription>Actions des membres de l'équipe</CardDescription>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.slice(0, 7).map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className="mt-1">
                          {getActionIcon(activity.action)}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm">{activity.description}</p>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDistanceToNow(new Date(activity.created_at), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="w-full">
                  Voir toutes les activités
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        {/* Shared Notes Tab */}
        <TabsContent value="notes" className="space-y-6">
          {notesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {sharedNotes.map((note) => (
                <Card key={note.id} className="w-full">
                  <CardHeader>
                    {editingNote === note.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md text-lg font-medium"
                        />
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <CardTitle>{note.title}</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => startEditing(note)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <CardDescription>
                      Créé {formatDistanceToNow(new Date(note.created_at), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {editingNote === note.id ? (
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={5}
                        className="w-full"
                      />
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        {note.content.split('\n').map((paragraph, idx) => (
                          <p key={`${note.id}-p-${idx}`}>{paragraph}</p>
                        ))}
                      </div>
                    )}
                    
                    {editingNote === note.id ? (
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={cancelEditing}>
                          Annuler
                        </Button>
                        <Button onClick={() => saveNoteEdit(note.id)}>
                          Sauvegarder
                        </Button>
                      </div>
                    ) : null}
                    
                    {note.comments.length > 0 && (
                      <div className="pt-4">
                        <h4 className="text-sm font-medium mb-2">Commentaires ({note.comments.length})</h4>
                        <div className="space-y-3">
                          {note.comments.map((comment) => (
                            <div key={comment.id} className="bg-muted p-3 rounded-md">
                              <div className="flex justify-between items-start">
                                <div className="font-medium text-sm">{comment.user_name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(comment.created_at), {
                                    addSuffix: true,
                                    locale: fr,
                                  })}
                                </div>
                              </div>
                              <p className="text-sm mt-1">{comment.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-2">
                      <Textarea
                        placeholder="Ajouter un commentaire..."
                        value={newComment[note.id] || ''}
                        onChange={(e) => setNewComment({ ...newComment, [note.id]: e.target.value })}
                        className="min-h-[80px]"
                      />
                      <div className="flex justify-end mt-2">
                        <Button 
                          onClick={() => handleCommentSubmit(note.id)}
                          disabled={!newComment[note.id]?.trim()}
                          size="sm"
                        >
                          Commenter
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Membres de l'équipe éducative</CardTitle>
              <CardDescription>Liste complète des intervenants</CardDescription>
            </CardHeader>
            <CardContent>
              {teamLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-6">
                  {team.map((member) => (
                    <div key={member.id} className="flex items-center justify-between pb-4 border-b last:border-0">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.avatar_url} alt={member.full_name} />
                          <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.full_name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" /> {member.role}
                          </div>
                          <div className="flex items-center mt-1">
                            <span 
                              className={`h-2 w-2 rounded-full ${getStatusColor(member.status)} mr-2`}
                            ></span>
                            <span className="text-xs text-muted-foreground">
                              {member.status === 'online' ? 'En ligne' : 'Dernière connexion il y a 3h'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-2" /> Message
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
