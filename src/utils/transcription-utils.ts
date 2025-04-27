
export function checkTranscriptionError(text: string): boolean {
  const errorKeywords = ["erreur", "impossible", "incorrect", "Erreur"];
  return errorKeywords.some(keyword => 
    text.toLowerCase().includes(keyword.toLowerCase())
  );
}
