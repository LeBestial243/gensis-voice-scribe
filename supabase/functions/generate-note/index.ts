
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

function generatePromptFromNotes({
  youngProfile,
  sections,
  selectedNotes
}) {
  const age = calculateAge(youngProfile.birth_date);

  const header = `
Tu es un assistant d'écriture destiné aux professionnels du secteur éducatif. Tu aides à générer une note structurée, claire et synthétique à partir d'observations déjà formalisées et stockées.

🔎 Profil du jeune :
- Prénom : ${youngProfile.first_name}
- Nom : ${youngProfile.last_name}
- Âge : ${age} ans
- Date de naissance : ${youngProfile.birth_date}
- Structure : ${youngProfile.structure}
- Projet éducatif : ${youngProfile.project || 'Non renseigné'}
- Date d'arrivée : ${youngProfile.arrival_date}
`;

  const corpus = `
📝 Notes sélectionnées par l'éducateur :
${selectedNotes.map((n) => `• ${n.content}`).join('\n')}
`;

  const structure = `
🧩 Structure attendue de la note finale :

${sections
  .sort((a, b) => a.order_index - b.order_index)
  .map((section, i) =>
    `${i + 1}. ${section.title}\n> ${section.instructions || 'Aucune instruction spécifique.'}`)
  .join('\n\n')}
`;

  const guidelines = `
✍️ Consignes pour l'IA :
- Reformuler intelligemment, ne jamais copier/coller
- Respecter l'ordre et l'intention pédagogique des sections
- Employer un ton professionnel, neutre et synthétique
`;

  return `${header}\n${corpus}\n${structure}\n${guidelines}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { youngProfile, templateSections, selectedNotes } = await req.json()
    
    const systemPrompt = generatePromptFromNotes({
      youngProfile,
      sections: templateSections,
      selectedNotes
    });

    console.log("System prompt:", systemPrompt);

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
          { role: 'user', content: 'Génère une note structurée à partir de ces informations.' }
        ],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const responseText = await response.text();
      console.error(`OpenAI API error (${response.status}): ${responseText}`);
      throw new Error(`OpenAI API error: ${responseText}`);
    }

    const data = await response.json()
    const generatedNote = data.choices[0].message.content

    return new Response(
      JSON.stringify({ content: generatedNote }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in generate-note function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
