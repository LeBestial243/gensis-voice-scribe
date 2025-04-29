
import { supabase } from "@/integrations/supabase/client";
import { FileType } from "@/types/files";

// Service centralisé pour la gestion des fichiers
export const fileService = {
  // Télécharger un fichier dans le stockage
  async uploadFile(file: File, folderId: string): Promise<FileType> {
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
              content: text
            })
            .select()
            .single();
            
          if (dbError) throw dbError;
          return data;
        }
        throw storageError;
      }
      
      // Créer l'entrée dans la base de données
      const { data, error } = await supabase
        .from('files')
        .insert({
          name: fileName,
          folder_id: folderId,
          type: file.type,
          size: file.size,
          path: filePath
        })
        .select()
        .single();
        
      if (error) throw error;
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

      if (fileError) throw fileError;
      if (!fileData) throw new Error('File not found');
      
      // Supprimer d'abord de la base de données pour éviter des fichiers orphelins
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;
      
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
      throw new Error("Impossible de générer le lien de téléchargement");
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
        
      if (error) throw error;
      
      // Si le contenu est déjà dans la base de données, le retourner
      if (data.content) {
        return data.content;
      }
      
      // Sinon, essayer de télécharger depuis le stockage
      if (data.path) {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('files')
          .download(data.path);
          
        if (downloadError) throw downloadError;
        
        const content = await fileData.text();
        return content;
      }
      
      throw new Error("Contenu du fichier non disponible");
    } catch (error) {
      console.error('Error getting file content:', error);
      throw error;
    }
  }
};
