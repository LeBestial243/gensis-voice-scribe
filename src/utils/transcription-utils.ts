
/**
 * Checks if a transcription text contains potential error keywords
 * 
 * @param text The transcription text to check
 * @returns boolean indicating if the text contains error keywords
 */
export function checkTranscriptionError(text: string): boolean {
  // Extended list of error keywords in French
  const errorKeywords = [
    "erreur", 
    "incohérence", 
    "impossible", 
    "incorrect", 
    "vérifier", 
    "problème",
    "échec",
    "incompréhensible",
    "incorrect",
    "invalide",
    "défaillance",
    "mauvais"
  ];
  
  return errorKeywords.some(keyword => 
    text.toLowerCase().includes(keyword.toLowerCase())
  );
}

/**
 * Returns a classname string based on whether there's a transcription error
 * 
 * @param hasError Whether there's a transcription error
 * @returns A string with CSS classes
 */
export function getErrorStyleClass(hasError: boolean): string {
  return hasError ? 'border-2 border-red-500' : '';
}
