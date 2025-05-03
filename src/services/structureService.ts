
import { supabase } from "@/integrations/supabase/client";
import { Structure, StructureUser, User } from "@/types/structures";

export const structureService = {
  async getStructures(): Promise<Structure[]> {
    // Since we don't have a structures table defined in the database yet,
    // we'll mock this response until a table is created with proper SQL migrations
    return [];
  },
  
  async createStructure(name: string, description: string | null): Promise<Structure> {
    // Mock implementation until database structure is updated
    return {
      id: "mock-id",
      name,
      description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  },
  
  async updateStructure(id: string, name: string, description: string | null): Promise<Structure> {
    // Mock implementation until database structure is updated
    return {
      id,
      name,
      description,
      updated_at: new Date().toISOString()
    };
  },
  
  async deleteStructure(id: string): Promise<void> {
    // Mock implementation until database structure is updated
    return;
  },
  
  async getStructureUsers(structureId: string): Promise<StructureUser[]> {
    // Mock implementation until database structure is updated
    return [];
  },
  
  async getAvailableUsers(structureId: string): Promise<User[]> {
    // Mock implementation until database structure is updated
    return [];
  },
  
  async addUserToStructure(userId: string, structureId: string, role: string): Promise<string> {
    // Mock implementation until database structure is updated
    return structureId;
  },
  
  async removeUserFromStructure(userId: string, structureId: string): Promise<boolean> {
    // Mock implementation until database structure is updated
    return true;
  }
};
