
import { supabase } from "@/integrations/supabase/client";
import { Structure, StructureUser, User } from "@/types/structures";

export const structureService = {
  async getStructures(): Promise<Structure[]> {
    try {
      // This is a mock implementation until the structures table is created
      // For simplicity, we're returning a static array of structures
      return [
        {
          id: "1",
          name: "Structure 1",
          description: "Description de la structure 1"
        },
        {
          id: "2",
          name: "Structure 2",
          description: "Description de la structure 2"
        },
        {
          id: "3",
          name: "Structure 3",
          description: "Description de la structure 3"
        }
      ];
    } catch (error) {
      console.error("Error fetching structures:", error);
      return [];
    }
  },
  
  async createStructure(name: string, description: string | null): Promise<Structure> {
    // Mock implementation until database structure is updated
    return {
      id: `mock-${Date.now()}`,
      name,
      description: description || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  },
  
  async updateStructure(id: string, name: string, description: string | null): Promise<Structure> {
    // Mock implementation until database structure is updated
    return {
      id,
      name,
      description: description || "",
      updated_at: new Date().toISOString()
    };
  },
  
  async deleteStructure(id: string): Promise<void> {
    // Mock implementation until database structure is updated
    console.log(`Structure with id ${id} would be deleted`);
    return;
  },
  
  async getStructureUsers(structureId: string): Promise<StructureUser[]> {
    // Mock implementation until database structure is updated
    return [
      {
        id: "user1",
        user_id: "user1",
        structure_id: structureId,
        role: "admin",
        email: "admin@example.com",
        first_name: "Admin",
        last_name: "User",
        display_name: "Admin User"
      },
      {
        id: "user2",
        user_id: "user2",
        structure_id: structureId,
        role: "member",
        email: "member@example.com",
        first_name: "Member",
        last_name: "User",
        display_name: "Member User"
      }
    ];
  },
  
  async getAvailableUsers(structureId: string): Promise<User[]> {
    // Mock implementation until database structure is updated
    return [
      {
        id: "user3",
        email: "available1@example.com",
        first_name: "Available",
        last_name: "User1",
        display_name: "Available User 1"
      },
      {
        id: "user4",
        email: "available2@example.com",
        first_name: "Available",
        last_name: "User2",
        display_name: "Available User 2"
      }
    ];
  },
  
  async addUserToStructure(userId: string, structureId: string, role: string): Promise<string> {
    // Mock implementation until database structure is updated
    console.log(`User ${userId} added to structure ${structureId} with role ${role}`);
    return `mock-user-structure-${Date.now()}`;
  },
  
  async removeUserFromStructure(userId: string, structureId: string): Promise<boolean> {
    // Mock implementation until database structure is updated
    console.log(`User ${userId} removed from structure ${structureId}`);
    return true;
  }
};
