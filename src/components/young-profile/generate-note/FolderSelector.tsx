import React, { useState, useEffect, useCallback, memo } from "react";
// ... autres imports

// Optimiser les fonctions de callback avec useCallback
const FolderSelector = ({
  profileId,
  selectedFolders,
  onFolderSelect,
  selectedFiles,
  onFileSelect
}: FolderSelectorProps) => {
  // ... état existant

  // Optimiser les fonctions avec useCallback
  const handleFolderClick = useCallback((folderId: string) => {
    console.log("Folder clicked:", folderId);
    
    const folder = folderStats.find(f => f.id === folderId);
    const isCurrentlySelected = selectedFolders.includes(folderId);
    
    // ... reste de la logique existante
  }, [folderStats, selectedFolders, selectedFiles, onFolderSelect, onFileSelect]);

  const toggleFolderExpand = useCallback((folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev =>
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  }, []);

  // ... reste du composant
};

// Exporter en utilisant memo pour éviter les re-rendus inutiles
export default memo(FolderSelector);