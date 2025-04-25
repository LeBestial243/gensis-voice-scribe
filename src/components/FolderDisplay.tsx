
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Folder, Plus, Loader2, FolderOpen, AlertCircle, File, UploadCloud } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FolderCard } from "./young-profile/FolderCard";

interface FolderDisplayProps {
  profileId: string;
  searchQuery?: string;
  activeFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
}

export function FolderDisplay({ 
  profileId, 
  searchQuery = "", 
  activeFolderId,
  onFolderSelect
}: FolderDisplayProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadFolderId, setUploadFolderId] = useState<string | null>(null);
  
  console.log("FolderDisplay: Rendering for profileId", profileId);
  console.log("FolderDisplay: Current activeFolderId", activeFolderId);
  
  const { 
    data: folders = [], 
    isLoading: foldersLoading
  } = useQuery({
    queryKey: ['folders', profileId],
    queryFn: async () => {
      console.log("FolderDisplay: Fetching folders for profile", profileId);
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('profile_id', profileId)
        .order('title', { ascending: true });

      if (error) {
        console.error('Error fetching folders:', error);
        throw error;
      }
      console.log("FolderDisplay: Fetched folders:", data);
      return data || [];
    },
    enabled: !!profileId
  });

  const { data: folderCounts = {}, refetch: refetchFolderCounts } = useQuery({
    queryKey: ['folder_counts', profileId],
    queryFn: async () => {
      const folderIds = folders.map(folder => folder.id);
      if (!folderIds.length) return {};
      
      console.log("FolderDisplay: Fetching file counts for folders", folderIds);
      
      const { data, error } = await supabase
        .from('files')
        .select('folder_id')
        .in('folder_id', folderIds);
      
      if (error) {
        console.error('Error fetching file counts:', error);
        throw error;
      }
      
      console.log("FolderDisplay: Raw file data for counts:", data);
      
      const counts: Record<string, number> = {};
      folderIds.forEach(id => { counts[id] = 0; });
      
      if (data) {
        data.forEach(file => {
          counts[file.folder_id] = (counts[file.folder_id] || 0) + 1;
        });
      }
      
      console.log("FolderDisplay: Calculated folder counts:", counts);
      return counts;
    },
    enabled: folders.length > 0
  });

  const createFolder = useMutation({
    mutationFn: async (title: string) => {
      console.log("FolderDisplay: Creating folder with title", title);
      const { data, error } = await supabase
        .from('folders')
        .insert({ title, profile_id: profileId })
        .select()
        .single();

      if (error) {
        console.error('Error creating folder:', error);
        throw error;
      }
      console.log("FolderDisplay: Created folder:", data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['folders', profileId] });
      toast({ 
        title: "Dossier créé", 
        description: `Le dossier "${data.title}" a été créé avec succès` 
      });
      setNewFolderName("");
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

  const uploadFile = useMutation({
    mutationFn: async ({ file, folderId }: { file: File, folderId: string }) => {
      console.log("FolderDisplay: Uploading file", file.name, "to folder", folderId);
      
      const fileName = file.name;
      const filePath = `${folderId}/${Date.now()}_${fileName}`;
      
      const { error: storageError, data: storageData } = await supabase.storage
        .from('files')
        .upload(filePath, file);
  
      if (storageError) {
        console.error('Error uploading to storage:', storageError);
        
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
            console.error('Error storing file as text:', dbError);
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
        console.error('Error creating file record:', error);
        throw error;
      }
      
      console.log("FolderDisplay: File record created in database:", data);
      return data;
    },
    onSuccess: () => {
      console.log("FolderDisplay: File upload successful, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['folder_counts'] });
      refetchFolderCounts();
      
      toast({ 
        title: "Fichier téléchargé", 
        description: "Le fichier a été téléchargé avec succès" 
      });
      setFileToUpload(null);
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

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Nom du dossier requis",
        description: "Veuillez saisir un nom pour le dossier",
        variant: "destructive",
      });
      return;
    }
    
    createFolder.mutate(newFolderName);
  };

  const handleUploadFile = () => {
    if (!fileToUpload || !uploadFolderId) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez sélectionner un fichier et un dossier",
        variant: "destructive",
      });
      return;
    }
    
    uploadFile.mutate({ file: fileToUpload, folderId: uploadFolderId });
  };

  const handleOpenUpload = (folderId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setUploadFolderId(folderId);
    setIsUploadOpen(true);
  };

  const handleFolderClick = (folderId: string) => {
    console.log("Clicked folder:", folderId, "Current active:", activeFolderId);
    // Only call onFolderSelect if the parent component provided it
    if (onFolderSelect) {
      // Toggle the folder: set to null if already active, otherwise set to the clicked folder ID
      onFolderSelect(folderId === activeFolderId ? null : folderId);
    }
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Dossiers</h2>
        <Button 
          onClick={() => setIsCreateFolderOpen(true)}
          className="bg-primary text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Créer un dossier
        </Button>
      </div>
      
      {filteredFolders.length === 0 ? (
        searchQuery ? (
          <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-lg bg-muted/50">
            <Folder className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun résultat</h3>
            <p className="text-muted-foreground">
              Aucun dossier ne correspond à "{searchQuery}"
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-lg bg-muted/50">
            <Folder className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun dossier</h3>
            <p className="text-muted-foreground">
              Créez votre premier dossier pour commencer à organiser vos fichiers
            </p>
            <Button 
              onClick={() => setIsCreateFolderOpen(true)} 
              className="mt-4"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer un dossier
            </Button>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFolders.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              fileCount={folderCounts[folder.id] || 0}
              isActive={folder.id === activeFolderId}
              onToggle={() => handleFolderClick(folder.id)}
              onUploadClick={handleOpenUpload}
            />
          ))}
        </div>
      )}
      
      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Créer un nouveau dossier</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="folderName">Nom du dossier</Label>
              <Input
                id="folderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Ex: Rapports médicaux"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsCreateFolderOpen(false)}
            >
              Annuler
            </Button>
            <Button 
              type="button" 
              onClick={handleCreateFolder}
              disabled={createFolder.isPending}
            >
              {createFolder.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un fichier</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="file">Sélectionner un fichier</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    setFileToUpload(files[0]);
                  }
                }}
              />
              {fileToUpload && (
                <p className="text-sm text-muted-foreground">
                  Fichier sélectionné: {fileToUpload.name} ({(fileToUpload.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsUploadOpen(false)}
            >
              Annuler
            </Button>
            <Button 
              type="button" 
              onClick={handleUploadFile}
              disabled={uploadFile.isPending || !fileToUpload}
            >
              {uploadFile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Téléchargement...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Télécharger
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
