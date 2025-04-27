
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

// Analyze relevance of content for each section
async function analyzeContentRelevance(files, templateSections, youngProfile) {
  console.log(`Analyzing relevance for ${files.length} files and ${templateSections.length} sections`);
  
  const contentBySection = {};
  
  for (const section of templateSections) {
    contentBySection[section.id] = [];
    
    for (const file of files) {
      if (!file.content || file.content.trim().length < 10) {
        continue; // Skip empty or very short files
      }
      
      // Use AI to determine if the content is relevant for this section
      const prompt = `
Détermine si ce contenu est pertinent pour la section "${section.title}" d'une note professionnelle.

Instructions pour la section: ${section.instructions || 'Pas d\'instructions spécifiques'}

Contenu à analyser:
"""
${file.content}
"""

Réponds UNIQUEMENT par OUI ou NON, suivi d'une très brève explication de maximum 15 mots.
`;
      
      try {
        const analysis = await callAIModel(prompt);
        console.log(`Analysis for file ${file.id}, section ${section.title}: ${analysis.substring(0, 50)}...`);
        
        if (analysis.trim().toUpperCase().startsWith('OUI')) {
          contentBySection[section.id].push(file.content);
        }
      } catch (error) {
        console.error(`Error analyzing file ${file.id} for section ${section.id}:`, error);
        // Continue with other files even if one fails
      }
    }
  }
  
  return contentBySection;
}

// Main function to generate the note
async function generateNote(youngProfile, templateSections, contentBySection) {
  const age = calculateAge(youngProfile.birth_date);

  // Create a prompt that includes relevant content for each section
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

${templateSections
  .sort((a, b) => a.order_index - b.order_index)
  .map((section) => {
    // Get relevant content for this section
    const relevantContent = contentBySection[section.id] || [];
    
    return `### ${section.title}
${section.instructions ? `[Instructions: ${section.instructions}]` : ''}

${relevantContent.length > 0 
  ? `[Voici le contenu pertinent pour cette section - SYNTHÉTISE-LE DE MANIÈRE PROFESSIONNELLE:]
${relevantContent.join('\n\n')}` 
  : '[Aucun contenu pertinent trouvé pour cette section]'}
`;
  })
  .join('\n\n')}

✍️ RÈGLES ABSOLUES :
1. La note DOIT contenir TOUTES les sections du template, avec leurs titres EXACTS
2. Chaque section DOIT commencer par son titre en format ### 
3. Si aucun contenu pertinent n'est disponible pour une section, écris "Pas d'information disponible pour cette section"
4. N'ajoute AUCUNE section qui n'est pas dans le template
5. Respecte l'ordre exact des sections
6. Utilise un ton professionnel et neutre d'éducateur spécialisé
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
    
    // Parse request body
    const requestData = await req.json();
    console.log("Données reçues:", {
      hasYoungProfile: !!requestData.youngProfile,
      hasTemplateSections: !!requestData.templateSections,
      hasSelectedFolders: !!requestData.selectedFolders,
      folderCount: requestData.selectedFolders?.length || 0
    });
    
    const { youngProfile, templateSections, selectedFolders } = requestData;
    
    if (!youngProfile) {
      throw new Error("Profil du jeune manquant");
    }
    
    if (!selectedFolders || selectedFolders.length === 0) {
      throw new Error("Aucun dossier sélectionné");
    }

    if (!templateSections || templateSections.length === 0) {
      throw new Error("Sections du template manquantes");
    }

    // Fetch files from the selected folders
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('*')
      .in('folder_id', selectedFolders)
      .eq('type', 'transcription')
      .order('created_at', { ascending: false });

    if (filesError) {
      throw new Error(`Erreur lors de la récupération des fichiers: ${filesError.message}`);
    }

    if (!files || files.length === 0) {
      throw new Error("Aucune transcription trouvée dans les dossiers sélectionnés");
    }

    console.log(`Found ${files.length} files from ${selectedFolders.length} folders`);

    // Analyze content relevance for each section
    const contentBySection = await analyzeContentRelevance(files, templateSections, youngProfile);
    
    // Generate the note using the analyzed content
    const generatedNote = await generateNote(youngProfile, templateSections, contentBySection);

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
