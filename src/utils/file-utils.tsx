
import React from 'react';
import { FileText, FileImage, FileVideo, FileArchive, File } from "lucide-react";

export const getFileIcon = (type: string) => {
  if (type.includes('pdf')) {
    return <FileText className="h-8 w-8 text-red-500" />;
  }
  if (type.includes('image')) {
    return <FileImage className="h-8 w-8 text-blue-500" />;
  }
  if (type.includes('zip') || type.includes('rar')) {
    return <FileArchive className="h-8 w-8 text-amber-500" />;
  }
  if (type.includes('document') || type.includes('word')) {
    return <FileText className="h-8 w-8 text-emerald-500" />;
  }
  if (type.includes('video')) {
    return <FileVideo className="h-8 w-8 text-purple-500" />;
  }
  return <File className="h-8 w-8 text-gray-500" />;
};

export const formatFileSize = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};
