
import { Section, FileContent } from "@/types/note-generation";
import { normalizeText, isTextMatch } from "@/utils/text-processing";

export const processSection = async (section: Section, fileContents: FileContent[]): Promise<string> => {
  const sectionTitle = normalizeText(section.title);
  console.log(`=== Processing section: "${section.title}" (normalized: "${sectionTitle}") ===`);

  const relevantFiles = fileContents.filter(file => {
    const folderName = normalizeText(file.folderName);
    console.log(`Comparing section "${sectionTitle}" with folder "${folderName}" (original: "${file.folderName}")`);
    
    const isMatch = isTextMatch(sectionTitle, folderName);
    
    if (isMatch) {
      console.log(`MATCH FOUND: Section "${section.title}" matches folder "${file.folderName}"`);
    }
    
    return isMatch;
  });

  console.log(`Found ${relevantFiles.length} relevant files for section "${section.title}"`);
  
  if (relevantFiles.length > 0) {
    console.log(`Files found:`, relevantFiles.map(f => ({ name: f.name, folder: f.folderName })));
  }

  if (relevantFiles.length === 0) {
    return `*Aucune information n'a été trouvée pour cette section.*`;
  }

  const relevantContent = relevantFiles
    .filter(file => file.content && file.content.length > 0)
    .map(file => file.content)
    .join('\n\n');

  return relevantContent || `*Aucune information n'a été trouvée pour cette section.*`;
};
