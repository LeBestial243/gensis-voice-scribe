
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { transcriptions, templateSections, profileData } = await req.json()
    
    const systemPrompt = `Tu es un assistant d'écriture spécialisé pour les professionnels éducatifs.
    
Données du jeune :
- Prénom : ${profileData.first_name}
- Nom : ${profileData.last_name || ''}
- Structure : ${profileData.structure || 'Non spécifiée'}
- Date d'arrivée : ${profileData.arrival_date || ''}
- Date de naissance : ${profileData.birth_date || ''}

Voici les observations à synthétiser :
${transcriptions}

Structure attendue :
${templateSections.map(section => `${section.title}:\n${section.instructions || 'Pas d'instruction spécifique'}`).join('\n\n')}

Consignes :
- Adopte un langage professionnel et neutre
- Structure le texte selon les sections indiquées
- Reformule de manière intelligente les observations
- Reste factuel et objectif
- Ne pas copier les phrases brutes des transcriptions`;

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
