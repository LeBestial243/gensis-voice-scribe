
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ChevronLeft, UserPlus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { StructureUser, User } from "@/types/structures";

interface StructureUsersManagementProps {
  structureId: string;
  structureName: string;
  onBack: () => void;
}

export function StructureUsersManagement({ structureId, structureName, onBack }: StructureUsersManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("member");
  
  // Fetch structure users
  const { data: structureUsers = [], isLoading } = useQuery({
    queryKey: ['structure_users', structureId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        'get_structure_users',
        { p_structure_id: structureId }
      );
      
      if (error) throw error;
      
      // Transform and add display names
      const users = Array.isArray(data) ? data : [];
      
      return users.map((user: any) => ({
        id: user.id,
        user_id: user.user_id,
        structure_id: user.structure_id,
        role: user.role,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        display_name: user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}`
          : user.email
      })) as StructureUser[];
    },
  });

  // Fetch available users not in the structure
  const { data: availableUsers = [] } = useQuery({
    queryKey: ['available_users', structureId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        'get_available_users',
        { p_structure_id: structureId }
      );
      
      if (error) throw error;
      
      const users = Array.isArray(data) ? data : [];
      
      return users.map((user: any) => ({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        display_name: user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}` 
          : user.email
      })) as User[];
    },
    enabled: isAddUserDialogOpen,
  });

  // Add user to structure mutation
  const addUserToStructure = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      if (!userId) throw new Error("Veuillez sélectionner un utilisateur");
      
      const { data, error } = await supabase.rpc(
        'add_user_to_structure',
        {
          p_user_id: userId,
          p_structure_id: structureId,
          p_role: role
        }
      );
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['structure_users', structureId] });
      toast({
        title: "Utilisateur ajouté",
        description: "L'utilisateur a été ajouté à la structure avec succès"
      });
      setIsAddUserDialogOpen(false);
      setSelectedUserId("");
      setSelectedRole("member");
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: (error as Error).message || "Une erreur est survenue",
        variant: "destructive"
      });
    }
  });

  // Remove user from structure mutation
  const removeUserFromStructure = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.rpc(
        'remove_user_from_structure',
        {
          p_user_id: userId,
          p_structure_id: structureId
        }
      );
      
      if (error) throw error;
      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['structure_users', structureId] });
      toast({
        title: "Utilisateur retiré",
        description: "L'utilisateur a été retiré de la structure avec succès"
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

  // Handler for adding a user
  const handleAddUser = () => {
    if (!selectedUserId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un utilisateur",
        variant: "destructive"
      });
      return;
    }
    
    addUserToStructure.mutate({
      userId: selectedUserId,
      role: selectedRole
    });
  };

  // Handler for removing a user
  const handleRemoveUser = () => {
    if (deleteUserId) {
      removeUserFromStructure.mutate(deleteUserId);
    }
  };

  // Effect to reset selected user when dialog is closed
  useEffect(() => {
    if (!isAddUserDialogOpen) {
      setSelectedUserId("");
      setSelectedRole("member");
    }
  }, [isAddUserDialogOpen]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
          <h2 className="text-3xl font-bold tracking-tight ml-2">Utilisateurs de {structureName}</h2>
        </div>
        <Button onClick={() => setIsAddUserDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Ajouter un utilisateur
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membres de la structure</CardTitle>
        </CardHeader>
        <CardContent>
          {structureUsers.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Aucun utilisateur</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Ajoutez des utilisateurs à cette structure pour partager les templates
              </p>
              <Button onClick={() => setIsAddUserDialogOpen(true)} className="mt-4">
                <UserPlus className="h-4 w-4 mr-2" />
                Ajouter un utilisateur
              </Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {structureUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.display_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="capitalize">{user.role}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteUserId(user.user_id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Retirer</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un utilisateur</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user-select">Utilisateur</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="user-select">
                  <SelectValue placeholder="Sélectionner un utilisateur" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.length === 0 ? (
                    <SelectItem value="no-users" disabled>
                      Aucun utilisateur disponible
                    </SelectItem>
                  ) : (
                    availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.display_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role-select">Rôle</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="role-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membre</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="viewer">Lecteur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddUser} disabled={!selectedUserId}>
              Ajouter
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
              L'utilisateur sera retiré de cette structure et n'aura plus accès aux templates associés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveUser} className="bg-destructive text-destructive-foreground">
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
