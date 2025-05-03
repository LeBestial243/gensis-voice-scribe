
import { supabase } from "@/integrations/supabase/client";
import { Structure, StructureUser, User } from "@/types/structures";

export const structureService = {
  async getStructures(): Promise<Structure[]> {
    // Utilisation de la requête directe à la table structures
    const { data, error } = await supabase
      .from('structures')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data as unknown as Structure[];
  },
  
  async createStructure(name: string, description: string | null): Promise<Structure> {
    const { data, error } = await supabase
      .from('structures')
      .insert([{ name, description }])
      .select()
      .single();
    
    if (error) throw error;
    return data as unknown as Structure;
  },
  
  async updateStructure(id: string, name: string, description: string | null): Promise<Structure> {
    const { data, error } = await supabase
      .from('structures')
      .update({ name, description })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as unknown as Structure;
  },
  
  async deleteStructure(id: string): Promise<void> {
    const { error } = await supabase
      .from('structures')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
  
  async getStructureUsers(structureId: string): Promise<StructureUser[]> {
    // Utilisation de la fonction RPC pour éviter les problèmes de type
    const { data, error } = await supabase
      .rpc('get_structure_users', { p_structure_id: structureId });
    
    if (error) throw error;
    return data as StructureUser[];
  },
  
  async getAvailableUsers(structureId: string): Promise<User[]> {
    // Utilisation de la fonction RPC pour éviter les problèmes de type
    const { data, error } = await supabase
      .rpc('get_available_users', { p_structure_id: structureId });
    
    if (error) throw error;
    return data as User[];
  },
  
  async addUserToStructure(userId: string, structureId: string, role: string): Promise<string> {
    // Utilisation de la fonction RPC pour éviter les problèmes de type
    const { data, error } = await supabase
      .rpc('add_user_to_structure', { 
        p_user_id: userId, 
        p_structure_id: structureId, 
        p_role: role 
      });
    
    if (error) throw error;
    return data as string;
  },
  
  async removeUserFromStructure(userId: string, structureId: string): Promise<boolean> {
    // Utilisation de la fonction RPC pour éviter les problèmes de type
    const { data, error } = await supabase
      .rpc('remove_user_from_structure', { 
        p_user_id: userId, 
        p_structure_id: structureId 
      });
    
    if (error) throw error;
    return data as boolean;
  }
};
