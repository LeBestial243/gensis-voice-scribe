
import { Section, FileContent } from "@/types/note-generation";
import { isTextMatch } from "@/utils/text-processing";

export const processSection = async (section: Section, fileContents: FileContent[]): Promise<string> => {
  console.log(`=== Processing section: "${section.title}" ===`);

  // Filter files relevant to this section based on folder name matching
  const relevantFiles = fileContents.filter(file => 
    isTextMatch(section.title, file.folderName)
  );

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

  if (!relevantContent) {
    return `*Aucune information n'a été trouvée pour cette section.*`;
  }

  return relevantContent;
};
