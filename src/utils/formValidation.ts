
import { z } from "zod";

// Schémas de validation réutilisables
export const emailSchema = z.string()
  .email("Adresse email invalide")
  .min(5, "L'email est trop court")
  .max(100, "L'email est trop long");

export const passwordSchema = z.string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .max(100, "Le mot de passe est trop long")
  .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
  .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
  .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre");

export const nameSchema = z.string()
  .min(2, "Doit contenir au moins 2 caractères")
  .max(50, "Nom trop long");

// Validation pour les fichiers
export const fileValidation = {
  // Validation des types de fichiers
  isAllowedFileType: (file: File, allowedTypes: string[]): boolean => {
    return allowedTypes.some(type => {
      if (type.includes('*')) {
        // Gérer les types génériques comme 'image/*'
        const [category] = type.split('/');
        return file.type.startsWith(category + '/');
      }
      return file.type === type;
    });
  },
  
  // Validation de la taille du fichier
  isFileSizeValid: (file: File, maxSizeInBytes: number): boolean => {
    return file.size <= maxSizeInBytes;
  }
};
