
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useFileStorage(folderId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check if storage bucket exists
  useQuery({
    queryKey: ['storage-bucket-check'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.storage.listBuckets();
        
        if (error) throw error;
        
        // Check if 'files' bucket exists
        const filesBucket = data.find(bucket => bucket.name === 'files');
        
        if (!filesBucket) {
          console.log('Creating files bucket');
          // Create the bucket
          const { error: createError } = await supabase.storage.createBucket('files', {
            public: true
          });
          
          if (createError) throw createError;
          
          console.log('Files bucket created successfully');
        }
        
        return true;
      } catch (error) {
        console.error('Error checking/creating storage bucket:', error);
        return false;
      }
    },
    staleTime: Infinity, // Only check once per session
  });

  // Delete file function with proper error handling
  const deleteFile = useMutation({
    mutationFn: async (fileId: string) => {
      console.log("Starting deletion of file with ID", fileId);
      
      // Get the file info first to get the path
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .select('path')
        .eq('id', fileId)
        .single();

      if (fileError) throw fileError;
      if (!fileData) throw new Error('File not found');

      // Delete from database first
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;
      
      // Only attempt to delete from storage if path exists
      if (fileData.path && fileData.path.trim() !== '') {
        const { error: storageError } = await supabase.storage
          .from('files')
          .remove([fileData.path]);

        if (storageError) {
          console.warn('Storage deletion failed but database record was deleted:', storageError);
        }
      }
      
      return fileId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', folderId] });
      queryClient.invalidateQueries({ queryKey: ['folder_counts'] });
      toast({ 
        title: "Fichier supprimé", 
        description: "Le fichier a été supprimé avec succès"
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur lors de la suppression",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive",
      });
    }
  });

  return {
    deleteFile
  };
}
