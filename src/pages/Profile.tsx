import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { FileDisplay } from "./FileDisplay"; // Importez le nouveau composant
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Folder as FolderIcon, 
  FolderOpen, 
  Plus, 
  UploadCloud, 
  FileText,
  Loader2 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FolderDisplayProps {
  profileId: string;
  searchQuery?: string;
  activeFolderId?: string | null; // Accepte le dossier actif passé en prop
  onFolderSelect?: (folderId: string | null) => void; // Accepte une fonction de callback
}

export function FolderDisplay({ 
  profileId, 
  searchQuery = "", 
  activeFolderId = null, 
  onFolderSelect 
}: FolderDisplayProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Utilise l'état local uniquement si aucun contrôle externe n'est fourni
  const [localSelectedFolderId, setLocalSelectedFolderId] = useState<string | null>(null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadFolderId, setUploadFolderId] = useState<string | null>(null);
  
  // Utilise les props si fournies, sinon l'état local
  const selectedFolderId = activeFolderId !== undefined ? activeFolderId : localSelectedFolderId;
  
  // Fonction pour gérer la sélection des dossiers
  const handleFolderSelect = (folderId: string | null) => {
    if (onFolderSelect) {
      // Si une fonction de callback est fournie, l'utiliser
      onFolderSelect(folderId);
    } else {
      // Sinon, mettre à jour l'état local
      setLocalSelectedFolderId(folderId);
    }
  };
  
  // Récupération des dossiers
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
      return data;
    },
  });

  // Récupération du nombre de fichiers par dossier
  const { data: folderCounts = {} } = useQuery({
    queryKey: ['folder_counts', profileId, folders.map(f => f.id).join(',')],
    queryFn: async () => {
      const folderIds = folders.map(folder => folder.id);
      if (!folderIds.length) return {};
      
      const { data, error } = await supabase
        .from('files')
        .select('folder_id, id')
        .in('folder_id', folderIds);
      
      if (error) throw error;
      
      // Compter les fichiers par dossier
      const counts: Record<string, number> = {};
      folderIds.forEach(id => { counts[id] = 0; });
      
      data.forEach(file => {
        counts[file.folder_id] = (counts[file.folder_id] || 0) + 1;
      });
      
      return counts;
    },
    enabled: folders.length > 0,
  });

  // Mutation pour créer un dossier
  const createFolder = useMutation({
    mutationFn: async (title: string) => {
      const { data, error } = await supabase
        .from('folders')
        .insert({ title, profile_id: profileId })
        .select()
        .single();

      if (error) throw error;
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
      // Sélectionner automatiquement le nouveau dossier
      handleFolderSelect(data.id);
    },
    onError: (error) => {
      toast({
        title: "Erreur lors de la création du dossier",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive",
      });
    }
  });

  // Mutation pour télécharger un fichier
  const uploadFile = useMutation({
    mutationFn: async ({ file, folderId }: { file: File, folderId: string }) => {
      // Étape 1: Télécharger le fichier dans le stockage
      const fileName = file.name;
      const filePath = `${folderId}/${Date.now()}_${fileName}`;
      
      const { error: storageError } = await supabase.storage
        .from('files')
        .upload(filePath, file);
  
      if (storageError) {
        console.error('Error uploading to storage:', storageError);
        // Si l'upload échoue, on essaie de stocker le contenu directement
        // en base de données pour les fichiers texte
        
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
        } else {
          throw storageError;
        }
      }
      
      // Étape 2: Créer l'entrée dans la base de données
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['folder_counts'] });
      toast({ 
        title: "Fichier téléchargé", 
        description: "Le fichier a été téléchargé avec succès" 
      });
      setFileToUpload(null);
      setIsUploadOpen(false);
    },
    onError: (error) => {
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

  const handleOpenUpload = (folderId: string) => {
    setUploadFolderId(folderId);
    setIsUploadOpen(true);
  };

  // Filtrer les dossiers en fonction de la recherche
  const filteredFolders = folders.filter(folder => 
    folder.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (foldersLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton de création de dossier */}
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
            <FolderIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun résultat</h3>
            <p className="text-muted-foreground">
              Aucun dossier ne correspond à "{searchQuery}"
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-lg bg-muted/50">
            <FolderIcon className="h-12 w-12 text-muted-foreground mb-4" />
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
            <Card 
              key={folder.id}
              className={`cursor-pointer hover:shadow-md transition-all duration-200 ${
                selectedFolderId === folder.id ? 'ring-2 ring-primary ring-offset-2' : ''
              }`}
              onClick={() => handleFolderSelect(selectedFolderId === folder.id ? null : folder.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    {selectedFolderId === folder.id ? (
                      <FolderOpen className="h-5 w-5 mr-2 text-primary" />
                    ) : (
                      <FolderIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                    )}
                    <CardTitle className="text-base">{folder.title}</CardTitle>
                  </div>
                  <Badge variant={selectedFolderId === folder.id ? "default" : "outline"}>
                    {folderCounts[folder.id] || 0} fichier{(folderCounts[folder.id] || 0) !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <CardDescription className="pl-7">
                  {folder.created_at && 
                    `Créé ${formatDistanceToNow(parseISO(folder.created_at), { 
                      addSuffix: true, 
                      locale: fr 
                    })}`
                  }
                </CardDescription>
              </CardHeader>
              
              {selectedFolderId === folder.id && (
                <CardContent>
                  {/* Boutons d'actions pour le dossier sélectionné */}
                  <div className="flex gap-2 my-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenUpload(folder.id);
                      }}
                    >
                      <UploadCloud className="h-4 w-4 mr-1" />
                      Ajouter un fichier
                    </Button>
                  </div>
                  
                  {/* Liste des fichiers du dossier */}
                  <div className="mt-4">
                    <FileDisplay folderId={folder.id} />
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
      
      {/* Dialogue de création de dossier */}
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
      
      {/* Dialogue de téléchargement de fichier */}
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