
import { supabase } from "@/integrations/supabase/client";
import { FileType } from "@/types/files";
import { formatSupabaseError } from "@/utils/errorHandler";

export type ConfidentialityLevel = 'public' | 'restricted' | 'confidential' | 'strict';

// Service centralisé pour la gestion des fichiers
export const fileService = {
  // Télécharger un fichier dans le stockage
  async uploadFile(
    file: File, 
    folderId: string, 
    confidentialityLevel: ConfidentialityLevel = 'public'
  ): Promise<FileType> {
    // Format standard du chemin
    const fileName = file.name;
    const filePath = `${folderId}/${Date.now()}_${fileName}`;
    
    try {
      // Télécharger dans le stockage
      const { error: storageError, data: storageData } = await supabase.storage
        .from('files')
        .upload(filePath, file);

      if (storageError) {
        // En cas d'échec du stockage, essayer de stocker comme contenu si c'est du texte
        if (file.type.includes('text') || file.size < 100000) {
          const text = await file.text();
          
          const { data, error: dbError } = await supabase
            .from('files')
            .insert({
              name: fileName,
              folder_id: folderId,
              type: file.type,
              size: file.size,
              path: null,
              content: text,
              confidentiality_level: confidentialityLevel
            })
            .select()
            .single();
            
          if (dbError) throw formatSupabaseError(dbError);
          return data;
        }
        throw formatSupabaseError(storageError);
      }
      
      // Créer l'entrée dans la base de données
      const { data, error } = await supabase
        .from('files')
        .insert({
          name: fileName,
          folder_id: folderId,
          type: file.type,
          size: file.size,
          path: filePath,
          confidentiality_level: confidentialityLevel
        })
        .select()
        .single();
        
      if (error) throw formatSupabaseError(error);
      return data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  // Supprimer un fichier
  async deleteFile(fileId: string): Promise<string> {
    try {
      // Récupérer d'abord les informations du fichier
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .select('path, name')
        .eq('id', fileId)
        .single();

      if (fileError) throw formatSupabaseError(fileError);
      if (!fileData) throw new Error('File not found');
      
      // Supprimer d'abord de la base de données pour éviter des fichiers orphelins
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw formatSupabaseError(dbError);
      
      // Supprimer du stockage uniquement si le chemin existe
      if (fileData.path && fileData.path.trim() !== '') {
        const { error: storageError } = await supabase.storage
          .from('files')
          .remove([fileData.path]);

        // On journalise l'erreur mais on ne l'échoue pas car le fichier est déjà supprimé de la base de données
        if (storageError) {
          console.warn('Storage removal failed but database record was deleted:', storageError);
        }
      }
      
      return fileId;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },

  // Télécharger un fichier
  async downloadFile(file: FileType): Promise<string> {
    if (!file.path) {
      throw new Error("Ce fichier ne peut pas être téléchargé (chemin manquant)");
    }
    
    const { data, error } = await supabase
      .storage
      .from('files')
      .createSignedUrl(file.path, 60);
    
    if (error || !data?.signedUrl) {
      throw formatSupabaseError(error || new Error("Impossible de générer le lien de téléchargement"));
    }
    
    return data.signedUrl;
  },

  // Obtenir le contenu d'un fichier
  async getFileContent(fileId: string): Promise<string> {
    try {
      // Essayer d'abord de récupérer depuis la base de données
      const { data, error } = await supabase
        .from('files')
        .select('content, path')
        .eq('id', fileId)
        .single();
        
      if (error) throw formatSupabaseError(error);
      
      // Si le contenu est déjà dans la base de données, le retourner
      if (data.content) {
        return data.content;
      }
      
      // Sinon, essayer de télécharger depuis le stockage
      if (data.path) {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('files')
          .download(data.path);
          
        if (downloadError) throw formatSupabaseError(downloadError);
        
        const content = await fileData.text();
        return content;
      }
      
      throw new Error("Contenu du fichier non disponible");
    } catch (error) {
      console.error('Error getting file content:', error);
      throw error;
    }
  },

  // Mettre à jour le niveau de confidentialité d'un fichier
  async updateConfidentiality(
    fileId: string, 
    level: ConfidentialityLevel
  ): Promise<FileType> {
    try {
      const { data, error } = await supabase
        .from('files')
        .update({ confidentiality_level: level })
        .eq('id', fileId)
        .select()
        .single();
      
      if (error) throw formatSupabaseError(error);
      return data;
    } catch (error) {
      console.error('Error updating file confidentiality:', error);
      throw error;
    }
  },

  // Récupérer les fichiers avec filtrage par niveau de confidentialité
  async getFiles(
    folderId: string, 
    options?: { confidentialityLevel?: ConfidentialityLevel }
  ): Promise<FileType[]> {
    try {
      let query = supabase
        .from('files')
        .select('*')
        .eq('folder_id', folderId);
      
      if (options?.confidentialityLevel) {
        query = query.eq('confidentiality_level', options.confidentialityLevel);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw formatSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error getting files:', error);
      throw error;
    }
  }
};
