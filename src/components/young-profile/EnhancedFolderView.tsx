
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Upload, MoreVertical, Folder, FileText, Plus 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface EnhancedFolderViewProps {
  profileId: string;
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function EnhancedFolderView({
  profileId,
  selectedFolderId,
  onFolderSelect,
  searchQuery,
  onSearchChange
}: EnhancedFolderViewProps) {
  const { toast } = useToast();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadFolderId, setUploadFolderId] = useState<string | null>(null);

  // Set initial animation state
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Fetch folders with counts
  const { 
    data: folders = [], 
    isLoading: foldersLoading,
    refetch: refetchFolders
  } = useQuery({
    queryKey: ['enhanced_folders', profileId],
    queryFn: async () => {
      console.log('Fetching folders for profile ID:', profileId);
      
      // Get folders
      const { data: folderData, error: folderError } = await supabase
        .from('folders')
        .select('*')
        .eq('profile_id', profileId)
        .order('title', { ascending: true });

      if (folderError) {
        console.error('Error fetching folders:', folderError);
        throw new Error(`Erreur lors du chargement des dossiers: ${folderError.message}`);
      }
      
      // Get counts for each folder
      const folderIds = folderData?.map(folder => folder.id) || [];
      let fileCounts: Record<string, number> = {};
      
      if (folderIds.length > 0) {
        const { data: fileData, error: fileError } = await supabase
          .from('files')
          .select('folder_id')
          .in('folder_id', folderIds);
        
        if (fileError) {
          console.error('Error fetching file counts:', fileError);
          throw new Error(`Erreur lors du comptage des fichiers: ${fileError.message}`);
        }
        
        // Count files per folder
        folderIds.forEach(id => { fileCounts[id] = 0; });
        fileData?.forEach(file => {
          fileCounts[file.folder_id] = (fileCounts[file.folder_id] || 0) + 1;
        });
      }
      
      // Format data for the component
      return folderData?.map(folder => ({
        id: folder.id,
        name: folder.title,
        files: fileCounts[folder.id] || 0,
        isSelected: folder.id === selectedFolderId,
        created_at: folder.created_at
      })) || [];
    },
    enabled: !!profileId,
    staleTime: 5000,
  });

  // Fetch transcriptions for the selected folder
  const {
    data: transcriptions = [],
    isLoading: transcriptionsLoading
  } = useQuery({
    queryKey: ['folder_files', selectedFolderId],
    queryFn: async () => {
      if (!selectedFolderId) return [];
      
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('folder_id', selectedFolderId)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching folder files:', error);
        throw new Error(`Erreur lors du chargement des fichiers: ${error.message}`);
      }
      
      return data?.map(file => ({
        id: file.id,
        name: file.name,
        author: "Utilisateur", // You might want to fetch actual author info
        authorInitials: "U", // Generate from actual author name
        created_at: file.created_at,
        type: file.type,
        path: file.path,
        content: file.content
      })) || [];
    },
    enabled: !!selectedFolderId,
    staleTime: 5000,
  });
  
  // Create folder mutation
  const createFolder = async () => {
    try {
      if (!newFolderName.trim()) {
        toast({
          title: "Nom du dossier requis",
          description: "Veuillez saisir un nom pour le dossier",
          variant: "destructive",
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('folders')
        .insert({ title: newFolderName, profile_id: profileId })
        .select()
        .single();

      if (error) {
        console.error('Error creating folder:', error);
        toast({
          title: "Erreur lors de la création du dossier",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      toast({ 
        title: "Dossier créé", 
        description: `Le dossier "${data.title}" a été créé avec succès` 
      });
      
      setNewFolderName("");
      setIsCreateFolderOpen(false);
      refetchFolders();
      onFolderSelect(data.id);
      
    } catch (error: any) {
      console.error('Error in createFolder:', error);
      toast({
        title: "Erreur lors de la création du dossier",
        description: error.message || "Une erreur s'est produite",
        variant: "destructive",
      });
    }
  };

  // Upload file mutation
  const uploadFile = async () => {
    try {
      if (!fileToUpload || !uploadFolderId) {
        toast({
          title: "Informations manquantes",
          description: "Veuillez sélectionner un fichier et un dossier",
          variant: "destructive",
        });
        return;
      }
      
      const fileName = fileToUpload.name;
      const filePath = `${uploadFolderId}/${Date.now()}_${fileName}`;
      
      // Upload to storage
      const { error: storageError } = await supabase.storage
        .from('files')
        .upload(filePath, fileToUpload);
  
      if (storageError) {
        console.error('Error uploading to storage:', storageError);
        
        if (fileToUpload.type.includes('text') || fileToUpload.size < 100000) {
          // Fallback to storing as text content
          const text = await fileToUpload.text();
          
          const { data, error: dbError } = await supabase
            .from('files')
            .insert({
              name: fileName,
              folder_id: uploadFolderId,
              type: fileToUpload.type,
              size: fileToUpload.size,
              path: null,
              content: text
            })
            .select()
            .single();
            
          if (dbError) {
            console.error('Error storing file as text:', dbError);
            throw dbError;
          }
          
          console.log("Successfully stored file as text:", data);
        } else {
          throw storageError;
        }
      } else {
        // Create file record in database
        const { error } = await supabase
          .from('files')
          .insert({
            name: fileName,
            folder_id: uploadFolderId,
            type: fileToUpload.type,
            size: fileToUpload.size,
            path: filePath
          });
          
        if (error) {
          console.error('Error creating file record:', error);
          throw error;
        }
      }
      
      toast({ 
        title: "Fichier téléchargé", 
        description: "Le fichier a été téléchargé avec succès" 
      });
      
      setFileToUpload(null);
      setIsUploadOpen(false);
      refetchFolders();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Erreur lors du téléchargement",
        description: error.message || "Une erreur s'est produite",
        variant: "destructive",
      });
    }
  };

  // Delete folder
  const deleteFolder = async (folderId: string) => {
    try {
      // Get files in this folder first (to delete from storage)
      const { data: files } = await supabase
        .from('files')
        .select('path')
        .eq('folder_id', folderId);
        
      // Delete files from storage if they have paths
      const filePaths = files?.filter(file => file.path).map(file => file.path) || [];
      if (filePaths.length > 0) {
        await supabase.storage
          .from('files')
          .remove(filePaths);
      }
      
      // Delete all file records
      await supabase
        .from('files')
        .delete()
        .eq('folder_id', folderId);
        
      // Delete the folder itself
      await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);
        
      toast({ 
        title: "Dossier supprimé", 
        description: "Le dossier et tous ses fichiers ont été supprimés" 
      });
      
      // If we deleted the selected folder, clear selection
      if (selectedFolderId === folderId) {
        onFolderSelect(null);
      }
      
      refetchFolders();
      
    } catch (error: any) {
      console.error('Error in deleteFolder:', error);
      toast({
        title: "Erreur lors de la suppression",
        description: error.message || "Une erreur s'est produite",
        variant: "destructive",
      });
    }
  };

  // Handle upload dialog opening
  const handleOpenUpload = (folderId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setUploadFolderId(folderId);
    setIsUploadOpen(true);
  };

  const filteredFolders = folders.filter(
    folder => folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Search bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={isLoaded ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-8"
      >
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Rechercher un dossier..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-12 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow focus:border-indigo-500 focus:ring-indigo-500/20"
          />
        </div>
      </motion.div>

      {/* Folders section */}
      <div className="flex justify-between items-center mb-4">
        <motion.h2
          initial={{ opacity: 0, x: -10 }}
          animate={isLoaded ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-xl font-bold text-gray-800 dark:text-white"
        >
          Dossiers
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={isLoaded ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Button
            onClick={() => setIsCreateFolderOpen(true)}
            className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            Créer un dossier
          </Button>
        </motion.div>
      </div>

      {/* Folders grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <AnimatePresence>
          {foldersLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="col-span-3 flex justify-center items-center p-12"
            >
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement des dossiers...</p>
              </div>
            </motion.div>
          ) : filteredFolders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="col-span-3"
            >
              <Card className="p-12 flex flex-col items-center justify-center text-center">
                <Folder className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-medium mb-2">
                  {searchQuery ? "Aucun résultat" : "Aucun dossier"}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery 
                    ? `Aucun dossier ne correspond à "${searchQuery}"`
                    : "Créez votre premier dossier pour commencer à organiser vos fichiers"}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setIsCreateFolderOpen(true)}
                    className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un dossier
                  </Button>
                )}
              </Card>
            </motion.div>
          ) : (
            filteredFolders.map((folder, index) => (
              <motion.div
                key={folder.id}
                initial={{ opacity: 0, y: 20 }}
                animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.05 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                onClick={() => onFolderSelect(folder.id === selectedFolderId ? null : folder.id)}
              >
                <Card 
                  className={cn(
                    "relative overflow-hidden p-5 cursor-pointer transition-all duration-300 group",
                    "border dark:border-gray-700",
                    folder.isSelected 
                      ? "border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/20 bg-indigo-50/70 dark:bg-indigo-900/20 backdrop-blur-sm" 
                      : "bg-white/90 dark:bg-gray-800/70 backdrop-blur-sm hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10"
                  )}
                >
                  <div className="absolute top-0 right-0 p-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Implement rename functionality
                            toast({
                              title: "Fonctionnalité à venir",
                              description: "La fonctionnalité de renommage sera bientôt disponible"
                            });
                          }}
                        >
                          Renommer
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600 dark:text-red-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFolder(folder.id);
                          }}
                        >
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-start gap-3">
                    <div 
                      className={cn(
                        "p-3 rounded-xl",
                        folder.isSelected 
                          ? "bg-indigo-500 text-white" 
                          : "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
                      )}
                    >
                      <Folder className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {folder.name}
                      </h3>
                      <Badge 
                        variant={folder.isSelected ? "default" : "outline"}
                        className={cn(
                          "mt-1",
                          folder.isSelected 
                            ? "bg-indigo-500 hover:bg-indigo-600" 
                            : "text-gray-600 dark:text-gray-400"
                        )}
                      >
                        {folder.files} fichier{folder.files !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>

                  {folder.isSelected && (
                    <div className="mt-6">
                      {folder.id === selectedFolderId && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mb-4 border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenUpload(folder.id, e);
                            }}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Ajouter un fichier
                          </Button>
                          
                          <div className="grid grid-cols-1 gap-4">
                            {transcriptionsLoading ? (
                              <div className="flex justify-center p-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-indigo-500"></div>
                              </div>
                            ) : transcriptions.length === 0 ? (
                              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 text-center">
                                <FileText className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-600 dark:text-gray-400">
                                  Aucun fichier dans ce dossier
                                </p>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="mt-2 text-indigo-600 dark:text-indigo-400"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenUpload(folder.id, e);
                                  }}
                                >
                                  <Upload className="h-4 w-4 mr-1" />
                                  Ajouter un fichier
                                </Button>
                              </div>
                            ) : (
                              transcriptions.map((transcript, tIndex) => (
                                <motion.div
                                  key={transcript.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: 0.1 + tIndex * 0.05 }}
                                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-300 group/item"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                      <FileText className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="break-words">
                                        <h4 className="font-medium text-gray-800 dark:text-gray-200 group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 transition-colors duration-300">
                                          {transcript.name}
                                        </h4>
                                      </div>
                                      <div className="flex items-center mt-1">
                                        <Avatar className="h-5 w-5 mr-2">
                                          <AvatarFallback className="text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                                            {transcript.authorInitials}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          {transcript.author}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Create folder dialog */}
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
              onClick={createFolder}
            >
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload file dialog */}
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
              onClick={uploadFile}
              disabled={!fileToUpload}
            >
              Télécharger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
