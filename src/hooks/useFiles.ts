interface DeleteFileOptions {
  fileId: string;
  showToast?: boolean;
}

// Dans le hook useFiles
const deleteMutation = useMutation({
  mutationFn: async ({ fileId, showToast = true }: DeleteFileOptions) => {
    console.log('useFiles: Starting delete for file', fileId);
    setDeletingFileId(fileId);
    
    try {
      // ... reste du code
      
      return {
        id: fileId,
        name: fileData?.name || 'File',
        wasDeleted: true
      };
    } catch (error) {
      console.error('useFiles: Delete operation failed', error);
      throw error;
    }
  },
  // ... reste du code
});

// Mettre à jour la fonction retournée
return {
  // ... autres retours existants
  deleteFile: (fileIdOrOptions: string | DeleteFileOptions) => {
    const options = typeof fileIdOrOptions === 'string' 
      ? { fileId: fileIdOrOptions } 
      : fileIdOrOptions;
    deleteMutation.mutate(options);
  },
};