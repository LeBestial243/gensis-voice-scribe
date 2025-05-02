
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

async function callAIModel(prompt: string, model = 'gpt-4o', temperature = 0.2) {
  try {
    console.log("Calling AI model with prompt:", prompt.substring(0, 100) + "...");
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: 'Tu es un éducateur spécialisé expérimenté qui rédige des rapports officiels conformes aux exigences administratives.' },
          { role: 'user', content: prompt }
        ],
        temperature: temperature,
        max_tokens: 2500,
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("Fonction generate-official-report appelée");
    
    const requestData = await req.json();
    console.log("Données reçues:", {
      hasProfileId: !!requestData.profileId,
      hasTemplateId: !!requestData.templateId,
      hasPeriodStart: !!requestData.periodStart,
      hasPeriodEnd: !!requestData.periodEnd,
      options: requestData.options
    });
    
    const { profileId, templateId, periodStart, periodEnd, options = {} } = requestData;
    const { includeNotes = true, includeTranscriptions = true, customInstructions = "" } = options;
    
    if (!profileId) throw new Error("Identifiant de profil requis");
    if (!templateId) throw new Error("Identifiant de modèle de rapport requis");
    if (!periodStart) throw new Error("Date de début de période requise");
    if (!periodEnd) throw new Error("Date de fin de période requise");

    // 1. Récupérer les données du profil
    const { data: profile, error: profileError } = await supabaseClient
      .from('young_profiles')
      .select('*')
      .eq('id', profileId)
      .single();
      
    if (profileError) throw new Error(`Erreur lors de la récupération du profil: ${profileError.message}`);
    if (!profile) throw new Error("Profil non trouvé");
    
    console.log(`Profil récupéré: ${profile.first_name} ${profile.last_name}`);
    
    // 2. Récupérer le modèle de rapport
    const { data: templates, error: templatesError } = await supabaseClient
      .from('report_templates')
      .select('*')
      .eq('id', templateId)
      .single();
      
    if (templatesError) throw new Error(`Erreur lors de la récupération du modèle: ${templatesError.message}`);
    if (!templates) throw new Error("Modèle de rapport non trouvé");
    
    console.log(`Modèle récupéré: ${templates.name}`);
    
    // 3. Récupérer les notes pour la période si demandé
    let notes = [];
    if (includeNotes) {
      const { data: notesData, error: notesError } = await supabaseClient
        .from('notes')
        .select('*')
        .eq('user_id', profileId)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd);
        
      if (notesError) throw new Error(`Erreur lors de la récupération des notes: ${notesError.message}`);
      notes = notesData || [];
      console.log(`${notes.length} notes récupérées`);
    }
    
    // 4. Récupérer les transcriptions pour la période si demandé
    let transcriptions = [];
    if (includeTranscriptions) {
      const { data: filesData, error: filesError } = await supabaseClient
        .from('files')
        .select('*')
        .eq('user_id', profileId)
        .eq('type', 'transcription')
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd);
        
      if (filesError) throw new Error(`Erreur lors de la récupération des transcriptions: ${filesError.message}`);
      transcriptions = filesData || [];
      console.log(`${transcriptions.length} transcriptions récupérées`);
    }
    
    // 5. Extraire les sections du modèle
    const templateStructure = templates.structure || { sections: [] };
    const templateSections = templateStructure.sections || [];
    
    // 6. Construire le prompt pour l'IA
    const age = calculateAge(profile.birth_date);
    
    const prompt = `
Tu es un éducateur spécialisé expérimenté qui rédige un rapport officiel pour ${profile.first_name} ${profile.last_name}.

INFORMATIONS SUR LE JEUNE:
- Nom: ${profile.last_name}
- Prénom: ${profile.first_name}
- Âge: ${age} ans
- Date de naissance: ${new Date(profile.birth_date).toLocaleDateString('fr-FR')}
- Date d'arrivée: ${profile.arrival_date ? new Date(profile.arrival_date).toLocaleDateString('fr-FR') : 'Non renseignée'}

INFORMATIONS SUR LE RAPPORT:
- Type de rapport: ${templates.name}
- Période couverte: du ${new Date(periodStart).toLocaleDateString('fr-FR')} au ${new Date(periodEnd).toLocaleDateString('fr-FR')}

STRUCTURE DU RAPPORT:
${templateSections.map(section => `- ${section.title}: ${section.description || 'Pas de description'}`).join('\n')}

SOURCES D'INFORMATIONS:
- ${notes.length} notes prises sur la période
- ${transcriptions.length} transcriptions d'entretiens ou observations

${notes.length > 0 ? `CONTENU DES NOTES:
${notes.slice(0, 10).map(note => `- ${note.title || 'Sans titre'}: ${note.content.substring(0, 200)}...`).join('\n')}
` : ''}

${transcriptions.length > 0 ? `EXTRAITS DE TRANSCRIPTIONS:
${transcriptions.slice(0, 5).map(trans => `- ${trans.name || 'Sans titre'}: ${trans.content?.substring(0, 200) || 'Contenu non disponible'}...`).join('\n')}
` : ''}

${customInstructions ? `INSTRUCTIONS SPÉCIFIQUES:
${customInstructions}
` : ''}

CONSIGNE:
Génère un rapport officiel structuré pour ${profile.first_name} ${profile.last_name} en suivant exactement les sections du modèle fourni. Pour chaque section, crée un contenu professionnel, factuel et précis basé sur les informations disponibles. Le rapport doit être rédigé dans un style formel adapté aux exigences administratives. Assure-toi que les informations présentées sont neutres, objectives et conformes aux standards professionnels des éducateurs spécialisés.

FORMAT DE SORTIE:
Fournis le rapport structuré au format JSON avec cette structure exacte:
{
  "title": "Titre du rapport",
  "reportType": "Type de rapport",
  "sections": [
    {
      "title": "Titre de la section",
      "content": "Contenu de la section"
    }
  ]
}
`;

    // 7. Appeler le modèle IA
    const reportJSON = await callAIModel(prompt);
    
    // 8. Parser et structurer la réponse
    let report;
    try {
      report = JSON.parse(reportJSON);
    } catch (e) {
      console.error("Erreur de parsing du JSON:", e);
      console.log("Réponse brute:", reportJSON);
      
      // Tentative de correction du JSON si possible
      const correctedJSON = reportJSON
        .replace(/^```json/, '')
        .replace(/```$/, '')
        .trim();
      
      try {
        report = JSON.parse(correctedJSON);
      } catch (e2) {
        throw new Error("La réponse de l'IA n'est pas un JSON valide");
      }
    }

    // 9. Structurer le rapport final
    const finalReport = {
      id: crypto.randomUUID(),
      profileId: profileId,
      title: report.title || `Rapport pour ${profile.first_name} ${profile.last_name}`,
      reportType: report.reportType || templates.name,
      startDate: periodStart,
      endDate: periodEnd,
      createdAt: new Date().toISOString(),
      sections: report.sections || [],
    };

    console.log("Rapport généré avec succès");
    
    return new Response(
      JSON.stringify(finalReport),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-official-report function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
