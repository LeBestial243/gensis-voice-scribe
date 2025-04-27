
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

function generatePromptFromTranscription({
  transcriptionText,
  youngProfile,
  sections
}) {
  const age = calculateAge(youngProfile.birth_date);

  return `
Tu es un assistant d'écriture pour éducateurs spécialisés. Tu dois générer une note qui respecte EXACTEMENT la structure du template fourni.

🔎 Profil du jeune :
- Prénom : ${youngProfile.first_name}
- Nom : ${youngProfile.last_name}
- Âge : ${age} ans
- Structure : ${youngProfile.structure || 'Non renseignée'}
- Date de naissance : ${youngProfile.birth_date}

🎙️ Transcription à structurer :
"""
${transcriptionText}
"""

🧩 STRUCTURE OBLIGATOIRE - TU DOIS GÉNÉRER EXACTEMENT CE FORMAT :

${sections
  .sort((a, b) => a.order_index - b.order_index)
  .map((section) =>
    `### ${section.title}
${section.instructions ? `[Instructions: ${section.instructions}]` : ''}

[Contenu à générer pour cette section en utilisant la transcription ci-dessus]
`)
  .join('\n\n')}

✍️ RÈGLES ABSOLUES :
1. La note DOIT contenir TOUTES les sections du template, avec leurs titres EXACTS
2. Chaque section DOIT commencer par son titre en format ### 
3. Si la transcription ne contient pas d'information pour une section, écris "Pas d'information disponible pour cette section"
4. N'ajoute AUCUNE section qui n'est pas dans le template
5. Respecte l'ordre exact des sections
6. Utilise un ton professionnel et neutre
7. Ne mets pas d'informations personnelles dans le corps de la note`;
}

function generatePromptFromNotes({
  youngProfile,
  sections,
  selectedNotes
}) {
  const age = calculateAge(youngProfile.birth_date);

  const header = `
Tu es un assistant d'écriture pour éducateurs spécialisés. Tu dois générer une note qui respecte EXACTEMENT la structure du template fourni.

🔎 Profil du jeune :
- Prénom : ${youngProfile.first_name}
- Nom : ${youngProfile.last_name}
- Âge : ${age} ans
- Date de naissance : ${youngProfile.birth_date}
- Structure : ${youngProfile.structure || 'Non renseignée'}
- Projet éducatif : ${youngProfile.project || 'Non renseigné'}
`;

  const corpus = `
📝 Contenu des observations :
${selectedNotes.map((n, i) => `[Note ${i + 1}] ${n.content}`).join('\n\n')}
`;

  const structure = `
🧩 STRUCTURE OBLIGATOIRE - TU DOIS GÉNÉRER EXACTEMENT CE FORMAT :

${sections
  .sort((a, b) => a.order_index - b.order_index)
  .map((section) =>
    `### ${section.title}
${section.instructions ? `[Instructions: ${section.instructions}]` : ''}

[Contenu à générer pour cette section en utilisant les observations ci-dessus]
`)
  .join('\n\n')}
`;

  const guidelines = `
✍️ RÈGLES ABSOLUES :
1. La note DOIT contenir TOUTES les sections du template, avec leurs titres EXACTS
2. Chaque section DOIT commencer par son titre en format ### 
3. Si les observations ne contiennent pas d'information pour une section, écris "Pas d'information disponible pour cette section"
4. N'ajoute AUCUNE section qui n'est pas dans le template
5. Respecte l'ordre exact des sections
6. Utilise un ton professionnel et neutre
7. Ne mets pas d'informations personnelles dans le corps de la note
`;

  return `${header}\n${corpus}\n${structure}\n${guidelines}`;
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
      hasSelectedNotes: !!requestData.selectedNotes,
      hasTranscriptionText: !!requestData.transcriptionText,
      transcriptionLength: requestData.transcriptionText?.length || 0
    });
    
    const { youngProfile, templateSections, selectedNotes, transcriptionText } = requestData;
    
    if (!youngProfile) {
      throw new Error("Profil du jeune manquant");
    }
    
    if (!transcriptionText && (!selectedNotes || selectedNotes.length === 0)) {
      throw new Error("Aucune source de contenu disponible (ni transcription, ni notes)");
    }

    // Generate the appropriate prompt based on input data
    const systemPrompt = transcriptionText ? 
      generatePromptFromTranscription({ transcriptionText, youngProfile, sections: templateSections }) :
      generatePromptFromNotes({ youngProfile, sections: templateSections, selectedNotes });

    console.log("Longueur du prompt système:", systemPrompt.length);

    const userPrompt = `
Génère maintenant une note professionnelle en respectant EXACTEMENT la structure du template.
TRÈS IMPORTANT : 
- Utilise UNIQUEMENT les sections définies dans le template
- Chaque section doit commencer par ### suivi du titre exact
- Ne crée pas d'autres sections que celles du template
- Respecte l'ordre des sections
`;

    // Call the OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 2000,
        presence_penalty: 0.0,
        frequency_penalty: 0.0
      }),
    });

    // Check for API errors
    if (!response.ok) {
      const responseText = await response.text();
      console.error(`OpenAI API error (${response.status}):`, responseText);
      throw new Error(`OpenAI API error (${response.status}): ${responseText}`);
    }

    // Parse and return the generated content
    const data = await response.json();
    console.log("Réponse OpenAI reçue:", {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length || 0,
      firstChoice: !!data.choices?.[0]
    });
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Format de réponse OpenAI invalide:", data);
      throw new Error("Format de réponse OpenAI invalide");
    }
    
    const generatedNote = data.choices[0].message.content;
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
