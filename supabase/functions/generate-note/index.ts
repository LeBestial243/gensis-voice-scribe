import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

function calculateAge(birthDate: string) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const month = today.getMonth() - birth.getMonth();
  
  if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

async function callAIModel(prompt: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'Tu es un éducateur spécialisé expérimenté qui rédige des notes professionnelles.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling AI model:", error);
    throw error;
  }
}

interface FileContent {
  content: string;
  folderName: string;
}

interface Section {
  id: string;
  title: string;
  instructions?: string;
  order_index: number;
}

const processSection = async (section: Section, fileContents: FileContent[]): Promise<string> => {
  const sectionTitle = section.title.toLowerCase()
    .replace(/[0-9]/g, '')
    .replace(/[.,!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/g, '')
    .trim();
  
  console.log(`Processing section: ${sectionTitle}`);

  const relevantFiles = fileContents.filter(file => {
    const folderName = file.folderName.toLowerCase()
      .replace(/[0-9]/g, '')
      .replace(/[.,!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/g, '')
      .trim();
    
    console.log(`Comparing section "${sectionTitle}" with folder "${folderName}"`);
    return sectionTitle === folderName || sectionTitle.includes(folderName) || folderName.includes(sectionTitle);
  });

  console.log(`Found ${relevantFiles.length} relevant files for section ${sectionTitle}`);

  if (relevantFiles.length === 0) {
    return `Pas d'information disponible pour cette section`;
  }

  const relevantContent = relevantFiles
    .filter(file => file.content && file.content.length > 0)
    .map(file => file.content)
    .join('\n\n');

  return relevantContent || `Pas d'information disponible pour cette section`;
};

async function generateNote(youngProfile, templateSections, files, folders) {
  const age = calculateAge(youngProfile.birth_date);
  
  // Prepare file contents with folder names
  const fileContents: FileContent[] = files.map(file => {
    const folder = folders.find(f => f.id === file.folder_id);
    return {
      content: file.content || '',
      folderName: folder?.title || ''
    };
  });

  // Process each section with the new logic
  const processedSections = await Promise.all(
    templateSections
      .sort((a, b) => a.order_index - b.order_index)
      .map(async (section) => {
        const content = await processSection(section, fileContents);
        return `### ${section.title}
${section.instructions ? `[Instructions: ${section.instructions}]` : ''}

${content}`;
      })
  );

  const prompt = `
Tu es un éducateur spécialisé expérimenté qui rédige une note professionnelle structurée.

🔎 Profil du jeune :
- Prénom : ${youngProfile.first_name}
- Nom : ${youngProfile.last_name}
- Âge : ${age} ans
- Structure : ${youngProfile.structure || 'Non renseignée'}
- Date de naissance : ${youngProfile.birth_date}
- Date d'arrivée : ${youngProfile.arrival_date || 'Non renseignée'}

🧩 STRUCTURE OBLIGATOIRE - TU DOIS GÉNÉRER EXACTEMENT CE FORMAT :

${processedSections.join('\n\n')}

✍️ RÈGLES ABSOLUES :
1. La note DOIT contenir TOUTES les sections du template, avec leurs titres EXACTS
2. Chaque section DOIT commencer par son titre en format ### 
3. Si aucun contenu pertinent n'est disponible pour une section, écris "Pas d'information disponible pour cette section"
4. N'ajoute AUCUNE section qui n'est pas dans le template
5. Respecte l'ordre exact des sections
6. Utilise un ton professionnel et neutre d'éducateur sp��cialisé
7. SYNTHÉTISE le contenu fourni pour chaque section - ne le répète pas tel quel
8. Priorise la clarté et la concision
`;

  try {
    console.log("Calling AI to generate final note");
    const generatedNote = await callAIModel(prompt);
    console.log("Note generation completed successfully");
    return generatedNote;
  } catch (error) {
    console.error("Error generating note:", error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("Fonction generate-note appelée");
    
    const requestData = await req.json();
    console.log("Données reçues:", {
      hasYoungProfile: !!requestData.youngProfile,
      hasTemplateSections: !!requestData.templateSections,
      hasSelectedFolders: !!requestData.selectedFolders,
      folderCount: requestData.selectedFolders?.length || 0
    });
    
    const { youngProfile, templateSections, selectedFolders } = requestData;
    
    if (!youngProfile) throw new Error("Profil du jeune manquant");
    if (!selectedFolders?.length) throw new Error("Aucun dossier sélectionné");
    if (!templateSections?.length) throw new Error("Sections du template manquantes");

    // Fetch folders first
    const { data: folders, error: foldersError } = await supabaseClient
      .from('folders')
      .select('id, title')
      .in('id', selectedFolders);

    if (foldersError) throw new Error(`Erreur lors de la récupération des dossiers: ${foldersError.message}`);
    if (!folders?.length) throw new Error("Impossible de trouver les dossiers sélectionnés");

    // Then fetch files
    const { data: files, error: filesError } = await supabaseClient
      .from('files')
      .select('*')
      .in('folder_id', selectedFolders)
      .in('type', ['transcription', 'text', 'text/plain'])
      .order('created_at', { ascending: false });

    if (filesError) throw new Error(`Erreur lors de la récupération des fichiers: ${filesError.message}`);
    if (!files?.length) throw new Error("Aucune transcription trouvée dans les dossiers sélectionnés");

    console.log(`Found ${files.length} files from ${folders.length} folders`);

    // Generate the note with the new processing logic
    const generatedNote = await generateNote(youngProfile, templateSections, files, folders);

    console.log("Note générée avec succès, longueur:", generatedNote.length);
    
    return new Response(
      JSON.stringify({ content: generatedNote }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-note function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
