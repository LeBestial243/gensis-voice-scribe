
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
  youngProfile
}) {
  const age = calculateAge(youngProfile.birth_date);

  return `
Tu es un assistant d'écriture destiné aux éducateurs spécialisés.  
Tu aides à transformer une transcription vocale en une note professionnelle claire, synthétique et bien formulée.

🔎 Informations sur le jeune concerné :
- Prénom : ${youngProfile.first_name}
- Nom : ${youngProfile.last_name}
- Âge : ${age} ans
- Date de naissance : ${youngProfile.birth_date}
- Structure : ${youngProfile.structure || 'Non renseignée'}
- Projet éducatif : ${youngProfile.project || 'Non renseigné'}

🎙️ Voici la transcription brute de l'observation orale :
"""${transcriptionText}"""

📝 Consignes :
- Reformule le contenu pour qu'il soit lisible et professionnel
- Supprime les hésitations, répétitions ou formulations orales
- Garde le sens exact des propos de l'éducateur
- Écris au présent de manière neutre et concise
- Ne déforme rien : reformule sans interpréter
`;
}

function generatePromptFromNotes({
  youngProfile,
  sections,
  selectedNotes
}) {
  const age = calculateAge(youngProfile.birth_date);

  const header = `
Tu es un assistant d'écriture destiné aux professionnels du secteur éducatif. Tu aides à générer une note STRUCTURÉE en suivant EXACTEMENT le template fourni.

🔎 Profil du jeune :
- Prénom : ${youngProfile.first_name}
- Nom : ${youngProfile.last_name}
- Âge : ${age} ans
- Date de naissance : ${youngProfile.birth_date}
- Structure : ${youngProfile.structure || 'Non renseignée'}
- Projet éducatif : ${youngProfile.project || 'Non renseigné'}
- Date d'arrivée : ${youngProfile.arrival_date || 'Non renseignée'}
`;

  const corpus = `
📝 Notes sélectionnées par l'éducateur :
${selectedNotes.map((n) => `• ${n.content}`).join('\n')}
`;

  const structure = sections && sections.length > 0 ? `
🧩 STRUCTURE OBLIGATOIRE À RESPECTER :

Tu dois OBLIGATOIREMENT suivre cette structure pour la note finale. Chaque section doit être présente dans l'ordre exact ci-dessous :

${sections
  .sort((a, b) => a.order_index - b.order_index)
  .map((section, i) =>
    `${i + 1}. ${section.title}\n-------------------\n${section.instructions ? `Instructions spécifiques : ${section.instructions}` : 'Développe cette section en utilisant les notes fournies.'}\n`)
  .join('\n\n')}
` : `
🧩 STRUCTURE OBLIGATOIRE À RESPECTER :

Tu dois OBLIGATOIREMENT suivre cette structure pour la note finale :

1. Introduction
-------------------
Présente la situation et le contexte

2. Observations principales
-------------------
Résume les points clés des observations

3. Analyse
-------------------
Propose une analyse des éléments observés

4. Conclusion et recommandations
-------------------
Synthétise et propose des pistes d'action
`;

  const guidelines = `
✍️ CONSIGNES IMPÉRATIVES :
1. Tu DOIS créer une section pour CHAQUE titre listé ci-dessus
2. Chaque section DOIT commencer par son titre exact suivi d'une ligne de séparation
3. Ne JAMAIS omettre une section, même si peu d'informations sont disponibles
4. Si une section manque d'informations, indique "Informations insuffisantes pour cette section"
5. Reformuler intelligemment, ne jamais copier/coller
6. Employer un ton professionnel, neutre et synthétique
7. Utiliser les informations des notes pour remplir les sections appropriées

FORMAT ATTENDU :
=============
[Titre de section 1]
-------------------
[Contenu de la section 1]

[Titre de section 2]
-------------------
[Contenu de la section 2]

etc.
`;

  return `${header}\n${corpus}\n${structure}\n${guidelines}`;
}

serve(async (req) => {
  // CORS pre-flight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
      generatePromptFromTranscription({ transcriptionText, youngProfile }) :
      generatePromptFromNotes({ youngProfile, sections: templateSections, selectedNotes });

    console.log("Longueur du prompt système:", systemPrompt.length);

    // Ajout d'instructions plus strictes pour GPT-4o
    const userPrompt = transcriptionText ?
      'Génère une note professionnelle reformulée à partir de ces informations.' :
      `Génère une note structurée en respectant EXACTEMENT la structure du template fourni.
      
      TRÈS IMPORTANT : Tu DOIS créer une section pour CHAQUE titre du template, dans l'ordre exact.
      Chaque section doit commencer par son titre exact suivi d'une ligne de séparation.
      NE PAS omettre de sections, même si peu d'informations sont disponibles.`;

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
        temperature: 0.3, // Réduit pour plus de précision
        max_tokens: 2000,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
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
