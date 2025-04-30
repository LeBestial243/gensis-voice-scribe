import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { FolderHeader } from "./folder-display/FolderHeader";
import { EmptyFolderState } from "./folder-display/EmptyFolderState";
import { FolderList } from "./folder-display/FolderList";
import { CreateFolderDialog } from "./folder-display/CreateFolderDialog";
import { UploadFileDialog } from "./folder-display/UploadFileDialog";

interface FolderDisplayProps {
  profileId: string;
  searchQuery?: string;
  activeFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
}

export function FolderDisplay({ 
  profileId, 
  searchQuery = "", 
  activeFolderId = null,
  onFolderSelect
}: FolderDisplayProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFolderId, setUploadFolderId] = useState<string | null>(null);
  
  console.log("FolderDisplay: Rendering with activeFolderId", activeFolderId);
  
  // Fetch folders query
  const { 
    data: folders = [], 
    isLoading: foldersLoading
  } = useQuery({
    queryKey: ['folders', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('profile_id', profileId)
        .order('title', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profileId
  });

  // Fetch folder counts query
  const { data: folderCounts = {} } = useQuery({
    queryKey: ['folder_counts', profileId],
    queryFn: async () => {
      const folderIds = folders.map(folder => folder.id);
      if (!folderIds.length) return {};
      
      const { data, error } = await supabase
        .from('files')
        .select('folder_id')
        .in('folder_id', folderIds);
      
      if (error) {
        console.error('Error fetching file counts:', error);
        throw error;
      }
      
      const counts: Record<string, number> = {};
      folderIds.forEach(id => { counts[id] = 0; });
      
      if (data) {
        data.forEach(file => {
          counts[file.folder_id] = (counts[file.folder_id] || 0) + 1;
        });
      }
      
      return counts;
    },
    enabled: folders.length > 0
  });

  // Create folder mutation
  const createFolder = useMutation({
    mutationFn: async (title: string) => {
      const { data, error } = await supabase
        .from('folders')
        .insert({ title, profile_id: profileId })
        .select()
        .single();

      if (error) {
        console.error('Error creating folder:', error);
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['folders', profileId] });
      toast({ 
        title: "Dossier créé", 
        description: `Le dossier "${data.title}" a été créé avec succès` 
      });
      setIsCreateFolderOpen(false);
      onFolderSelect(data.id);
    },
    onError: (error) => {
      console.error('Error in createFolder mutation:', error);
      toast({
        title: "Erreur lors de la création du dossier",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive",
      });
    }
  });

  // Delete folder mutation
  const deleteFolder = useMutation({
    mutationFn: async (folderId: string) => {
      console.log("FolderDisplay: Starting folder deletion for folder", folderId);
      
      // First, delete all files in the folder from storage
      const { data: files, error: filesError } = await supabase
        .from('files')
        .select('path')
        .eq('folder_id', folderId);
        
      if (filesError) {
        console.error('Error fetching files for deletion:', filesError);
        throw filesError;
      }
      
      // Delete files from storage if they have paths
      const filePaths = files?.filter(file => file.path).map(file => file.path) || [];
      if (filePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('files')
          .remove(filePaths);
          
        if (storageError) {
          console.warn('Error removing some files from storage:', storageError);
          // Continue with deletion even if storage removal fails
        }
      }
      
      // Delete all file records for this folder
      const { error: deleteFilesError } = await supabase
        .from('files')
        .delete()
        .eq('folder_id', folderId);
        
      if (deleteFilesError) {
        console.error('Error deleting files:', deleteFilesError);
        throw deleteFilesError;
      }
      
      // Finally, delete the folder itself
      const { error: deleteFolderError } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);
        
      if (deleteFolderError) {
        console.error('Error deleting folder:', deleteFolderError);
        throw deleteFolderError;
      }
      
      console.log("FolderDisplay: Folder deleted successfully");
      return folderId;
    },
    onSuccess: (deletedFolderId) => {
      queryClient.invalidateQueries({ queryKey: ['folders', profileId] });
      queryClient.invalidateQueries({ queryKey: ['folder_counts', profileId] });
      
      // If the deleted folder was active, clear the selection
      if (activeFolderId === deletedFolderId) {
        onFolderSelect(null);
      }
      
      toast({ 
        title: "Dossier supprimé", 
        description: "Le dossier et tous ses fichiers ont été supprimés avec succès" 
      });
    },
    onError: (error) => {
      console.error('Error in deleteFolder mutation:', error);
      toast({
        title: "Erreur lors de la suppression du dossier",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive",
      });
    }
  });

  // File upload mutation
  const uploadFile = useMutation({
    mutationFn: async ({ file, folderId }: { file: File, folderId: string }) => {
      console.log("FolderDisplay: Starting file upload for folder", folderId);
      const fileName = file.name;
      const filePath = `${folderId}/${Date.now()}_${fileName}`;
      
      const { error: storageError, data: storageData } = await supabase.storage
        .from('files')
        .upload(filePath, file);
  
      if (storageError) {
        console.error('FolderDisplay: Error uploading to storage:', storageError);
        
        if (file.type.includes('text') || file.size < 100000) {
          console.log("FolderDisplay: Fallback to storing as text content");
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
            
          if (dbError) {
            console.error('FolderDisplay: Error storing file as text:', dbError);
            throw dbError;
          }
          
          console.log("FolderDisplay: Successfully stored file as text:", data);
          return data;
        } else {
          throw storageError;
        }
      }
      
      console.log("FolderDisplay: File uploaded to storage successfully");
      
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
        
      if (error) {
        console.error('FolderDisplay: Error creating file record:', error);
        throw error;
      }
      
      console.log("FolderDisplay: File record created in database:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      if (uploadFolderId) {
        queryClient.invalidateQueries({ queryKey: ['files', uploadFolderId] });
      }
      queryClient.invalidateQueries({ queryKey: ['folder_counts'] });
      
      toast({ 
        title: "Fichier téléchargé", 
        description: "Le fichier a été téléchargé avec succès" 
      });
      setFileToUpload(null);
      setUploadFolderId(null);
      setIsUploadOpen(false);
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast({
        title: "Erreur lors du téléchargement",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive",
      });
    }
  });

  const handleCreateFolder = (folderName: string) => {
    createFolder.mutate(folderName);
  };

  const handleUploadFile = (file: File) => {
    if (!uploadFolderId) {
      toast({
        title: "Dossier non sélectionné",
        description: "Veuillez sélectionner un dossier pour télécharger le fichier",
        variant: "destructive",
      });
      return;
    }
    
    console.log("FolderDisplay: Uploading file", file.name, "to folder", uploadFolderId);
    uploadFile.mutate({ file, folderId: uploadFolderId });
  };

  const handleOpenUpload = (folderId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    console.log("FolderDisplay: Opening upload dialog for folder", folderId);
    setUploadFolderId(folderId);
    setIsUploadOpen(true);
  };

  const handleFolderClick = (folderId: string) => {
    onFolderSelect(folderId === activeFolderId ? null : folderId);
  };

  // Handler for folder deletion
  const handleDeleteFolder = (folderId: string) => {
    console.log("FolderDisplay: Handling delete for folder", folderId);
    deleteFolder.mutate(folderId);
  };

  if (foldersLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredFolders = folders.filter(folder => 
    folder.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  console.log("FolderDisplay: Rendering", filteredFolders.length, "folders with activeFolderId", activeFolderId);

  return (
    <div className="space-y-6">
      <FolderHeader onCreateFolder={() => setIsCreateFolderOpen(true)} />
      
      {filteredFolders.length === 0 ? (
        <EmptyFolderState 
          searchQuery={searchQuery} 
          onCreateFolder={() => setIsCreateFolderOpen(true)} 
        />
      ) : (
        <FolderList 
          folders={filteredFolders}
          folderCounts={folderCounts}
          activeFolderId={activeFolderId}
          onFolderSelect={handleFolderClick}
          onUploadClick={handleOpenUpload}
          onDeleteFolder={handleDeleteFolder}
        />
      )}
      
      <CreateFolderDialog
        isOpen={isCreateFolderOpen}
        onOpenChange={setIsCreateFolderOpen}
        onCreateFolder={handleCreateFolder}
        isPending={createFolder.isPending}
      />
      
      <UploadFileDialog
        isOpen={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        onUploadFile={handleUploadFile}
        isPending={uploadFile.isPending}
        folderId={uploadFolderId}
      />
    </div>
  );
}
