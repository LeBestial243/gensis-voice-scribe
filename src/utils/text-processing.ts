
export const normalizeText = (text: string): string => {
  return text.toLowerCase()
    .normalize("NFD") // Décompose les lettres accentuées
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .replace(/[^a-z\s]/g, '') // Garde uniquement les lettres et espaces
    .trim()
    .replace(/\s+/g, ' '); // Normalise les espaces
};

export const isTextMatch = (sectionTitle: string, folderName: string): boolean => {
  const isExactMatch = sectionTitle === folderName;
  const containsMatch = sectionTitle.includes(folderName) || folderName.includes(sectionTitle);
  
  // Vérifier si des mots significatifs correspondent
  const sectionWords = sectionTitle.split(' ').filter(word => word.length > 2);
  const folderWords = folderName.split(' ').filter(word => word.length > 2);
  
  const wordMatch = sectionWords.some(sectionWord => 
    folderWords.some(folderWord => 
      folderWord.includes(sectionWord) || sectionWord.includes(folderWord)
    )
  );
  
  return isExactMatch || containsMatch || wordMatch;
};
