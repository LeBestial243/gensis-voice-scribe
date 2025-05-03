
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Search } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StructureUser {
  id: string;
  user_id: string;
  structure_id: string;
  role: string;
  user_email?: string;
  user_name?: string;
}

interface User {
  id: string;
  email: string;
  display_name?: string;
}

interface StructureUsersManagementProps {
  structureId: string;
  structureName: string;
  onBack: () => void;
}

const ROLES = [
  { value: "admin", label: "Administrateur" },
  { value: "editor", label: "Éditeur" },
  { value: "viewer", label: "Lecteur" }
];

export function StructureUsersManagement({ structureId, structureName, onBack }: StructureUsersManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("viewer");
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  
  // Fetch structure users
  const { data: structureUsers = [], isLoading } = useQuery({
    queryKey: ['structure-users', structureId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('structure_users')
        .select(`
          id, 
          user_id, 
          structure_id, 
          role, 
          profiles!inner(email:auth.users!inner(email), first_name, last_name)
        `)
        .eq('structure_id', structureId);
      
      if (error) throw error;

      return (data || []).map((user): StructureUser => ({
        id: user.id,
        user_id: user.user_id,
        structure_id: user.structure_id,
        role: user.role,
        user_email: user.profiles?.email,
        user_name: user.profiles?.first_name && user.profiles?.last_name 
          ? `${user.profiles.first_name} ${user.profiles.last_name}` 
          : undefined
      }));
    },
  });

  // Search users
  const searchUsers = async () => {
    if (!searchTerm) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, 
          auth.users!inner(email), 
          first_name, 
          last_name
        `)
        .ilike('auth.users.email', `%${searchTerm}%`)
        .limit(10);

      if (error) throw error;

      setSearchResults((data || []).map((profile) => ({
        id: profile.id,
        email: profile.auth?.users?.email || '',
        display_name: profile.first_name && profile.last_name 
          ? `${profile.first_name} ${profile.last_name}` 
          : undefined
      })));
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rechercher des utilisateurs",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        searchUsers();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Add user to structure
  const addUserToStructure = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      // Check if user is already in structure
      const { data: existingUsers, error: checkError } = await supabase
        .from('structure_users')
        .select('id')
        .eq('structure_id', structureId)
        .eq('user_id', userId);
        
      if (checkError) throw checkError;
      
      if (existingUsers?.length) {
        throw new Error('Cet utilisateur est déjà associé à cette structure');
      }
      
      const { data, error } = await supabase
        .from('structure_users')
        .insert([
          { 
            user_id: userId,
            structure_id: structureId,
            role 
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['structure-users', structureId] });
      toast({
        title: "Utilisateur ajouté",
        description: "L'utilisateur a été ajouté avec succès à la structure"
      });
      setIsAddDialogOpen(false);
      setSelectedUser(null);
      setSelectedRole("viewer");
      setSearchTerm("");
      setSearchResults([]);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: (error as Error).message || "Une erreur est survenue",
        variant: "destructive"
      });
    }
  });

  // Remove user from structure
  const removeUserFromStructure = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('structure_users')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['structure-users', structureId] });
      toast({
        title: "Utilisateur retiré",
        description: "L'utilisateur a été retiré avec succès de la structure"
      });
      setDeleteUserId(null);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: (error as Error).message || "Une erreur est survenue",
        variant: "destructive"
      });
      setDeleteUserId(null);
    }
  });

  const handleAddUser = () => {
    if (!selectedUser) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un utilisateur",
        variant: "destructive"
      });
      return;
    }
    
    addUserToStructure.mutate({ 
      userId: selectedUser.id, 
      role: selectedRole 
    });
  };

  const handleDeleteUser = () => {
    if (deleteUserId) {
      removeUserFromStructure.mutate(deleteUserId);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setSearchTerm(user.email);
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'editor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'viewer':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{structureName}</h2>
          <p className="text-muted-foreground">Gestion des utilisateurs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            Retour
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter un utilisateur
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs</CardTitle>
          <CardDescription>
            Gérez les utilisateurs qui ont accès à cette structure et leurs permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {structureUsers.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="mt-4 text-lg font-medium">Aucun utilisateur</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Ajoutez des utilisateurs pour leur donner accès à cette structure
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> Ajouter un utilisateur
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {structureUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-md">
                  <div>
                    <div className="font-medium">
                      {user.user_name || user.user_email || 'Utilisateur sans nom'}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {user.user_email}
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeClass(user.role)}`}>
                      {ROLES.find(r => r.value === user.role)?.label || user.role}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setDeleteUserId(user.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Retirer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un utilisateur</DialogTitle>
            <DialogDescription>
              Recherchez un utilisateur pour l'ajouter à la structure {structureName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user-search">Rechercher un utilisateur</Label>
              <div className="relative">
                <Input 
                  id="user-search" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher par adresse email"
                  className="pr-10"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              
              {searchResults.length > 0 && !selectedUser && (
                <div className="border rounded-md mt-2 max-h-60 overflow-y-auto">
                  {searchResults.map((user) => (
                    <div 
                      key={user.id} 
                      className="p-2 hover:bg-accent cursor-pointer"
                      onClick={() => handleSelectUser(user)}
                    >
                      <div className="font-medium">
                        {user.display_name || user.email}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="user-role">Rôle</Label>
              <Select 
                value={selectedRole} 
                onValueChange={setSelectedRole}
              >
                <SelectTrigger id="user-role">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Les droits d'accès varient selon le rôle de l'utilisateur
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              setSelectedUser(null);
              setSearchTerm("");
              setSearchResults([]);
            }}>Annuler</Button>
            <Button onClick={handleAddUser} disabled={!selectedUser}>
              Ajouter l'utilisateur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cet utilisateur perdra l'accès à cette structure et à tous ses templates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground">
              Retirer l'utilisateur
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
