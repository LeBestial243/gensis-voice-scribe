
import { InconsistencyCheck, YoungProfile } from "@/types/inconsistency";
import { formatDate } from "./formatDate";

export const detectInconsistencies = (text: string, profile: YoungProfile): InconsistencyCheck[] => {
  const inconsistencies: InconsistencyCheck[] = [];
  
  if (!profile || !text) return inconsistencies;

  const birthDate = profile.birth_date ? new Date(profile.birth_date) : null;
  const arrivalDate = profile.arrival_date ? new Date(profile.arrival_date) : null;
  
  // Détection des noms incorrects
  const commonWords = ['jeune', 'enfant', 'adolescent', 'personne', 'il', 'elle'];
  const words = text.split(/\s+/);
  const properNouns = words.filter(word => 
    /^[A-Z][a-z]+$/.test(word) && !commonWords.includes(word.toLowerCase())
  );
  
  properNouns.forEach(noun => {
    if (noun !== profile.first_name && 
        noun !== profile.last_name && 
        !['France', 'Paris', 'Monsieur', 'Madame'].includes(noun)) {
      inconsistencies.push({
        type: 'name',
        message: `Nom différent de celui du jeune détecté: ${noun}`,
        severity: 'warning'
      });
    }
  });
  
  // Détection des dates incohérentes
  const yearRegex = /\b(19|20)\d{2}\b/g;
  const mentionedYears = text.match(yearRegex) || [];
  
  mentionedYears.forEach(year => {
    const yearNum = parseInt(year);
    if (birthDate && yearNum < birthDate.getFullYear() && text.toLowerCase().includes('arrivé')) {
      inconsistencies.push({
        type: 'date',
        message: `La déclaration indique une arrivée en ${year}, ce qui est incompatible avec la date de naissance (${formatDate(birthDate)})`,
        severity: 'error'
      });
    }
  });

  // Vérification de la cohérence des dates d'arrivée
  if (arrivalDate && birthDate) {
    if (arrivalDate < birthDate) {
      inconsistencies.push({
        type: 'date',
        message: `La date d'arrivée (${formatDate(arrivalDate)}) est antérieure à la date de naissance (${formatDate(birthDate)})`,
        severity: 'error'
      });
    }
  }
  
  return inconsistencies;
};
