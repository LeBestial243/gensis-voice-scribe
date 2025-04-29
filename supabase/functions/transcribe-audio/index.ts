
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Interface pour le profil du jeune
interface YoungProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  arrival_date?: string;
  structure?: string;
  project?: string;
}

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

// Add helper function for date formatting
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Fonction pour valider la cohérence de la transcription
async function validateTranscriptionCoherence(transcriptionText: string, youngProfile?: YoungProfile) {
  const inconsistencies: { type: string; message: string; severity: 'error' | 'warning' }[] = [];

  if (youngProfile && Object.keys(youngProfile).length > 0) {
    const birthDate = new Date(youngProfile.birth_date);
    const yearRegex = /\b(19|20)\d{2}\b/g;
    const mentionedYears = [...transcriptionText.matchAll(yearRegex)].map(match => parseInt(match[0]));
    
    mentionedYears.forEach(year => {
      if (year < birthDate.getFullYear()) {
        if (transcriptionText.toLowerCase().includes('arrivé')) {
          inconsistencies.push({
            type: 'date',
            message: `La déclaration indique que ${youngProfile.first_name} ${youngProfile.last_name} est arrivé en ${year}, ce qui est incompatible avec sa date de naissance, le ${formatDate(birthDate)}`,
            severity: 'error'
          });
        }
        
        if (transcriptionText.toLowerCase().includes('marié')) {
          inconsistencies.push({
            type: 'date',
            message: `La déclaration indique un mariage en ${year}, ce qui est impossible car ${youngProfile.first_name} est né(e) en ${birthDate.getFullYear()}`,
            severity: 'error'
          });
        }
      }
    });
  }

  return {
    isValid: inconsistencies.length === 0,
    message: inconsistencies.length > 0 ? 
      `La transcription présente des incohérences temporelles: ${inconsistencies.map(i => i.message).join(". ")}` : 
      "Transcription valide",
    inconsistencies
  };
}

// Fonction pour calculer l'âge à partir d'une date de naissance
function calculateAge(birthDateString: string): number {
  try {
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  } catch (e) {
    console.error("Erreur dans le calcul de l'âge:", e);
    return 0;
  }
}

// Fonction principale pour transformer et valider la transcription
async function reformulateTranscription(transcriptionText: string, youngProfile?: YoungProfile) {
  try {
    console.log('Reformulating transcription with GPT-4o...');
    console.log('Young profile data:', JSON.stringify(youngProfile || {}));
    
    // Vérifier la cohérence avant la reformulation
    const coherenceCheck = await validateTranscriptionCoherence(transcriptionText, youngProfile);
    let finalText = transcriptionText;
    
    // Vérifier que la clé API OpenAI est disponible
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OpenAI API key not available for reformulation');
      return { 
        text: transcriptionText,
        hasError: !coherenceCheck.isValid,
        errorMessage: coherenceCheck.message,
        inconsistencies: coherenceCheck.inconsistencies
      }; // Fallback: return original text
    }
    
    // Calculer l'âge si la date de naissance est disponible
    let age = 'Non renseigné';
    if (youngProfile?.birth_date) {
      age = calculateAge(youngProfile.birth_date).toString();
    }
    
    const systemPrompt = `Tu es un assistant d'écriture pour éducateurs spécialisés.
Ta mission est de transformer une transcription vocale en une note professionnelle structurée.

RÈGLES IMPÉRATIVES :
1. Si l'orateur dit "le jeune", "il", "elle", "l'enfant", "l'adolescent" sans mentionner de nom, c'est TOUJOURS ${youngProfile?.first_name} dont on parle
2. Ne signale PAS d'incohérence si d'autres noms sont mentionnés (ils peuvent être des amis, de la famille, etc.)
3. Corrige les erreurs de grammaire et de syntaxe
4. Structure le texte avec des paragraphes clairs
5. Utilise un vocabulaire professionnel de l'éducation spécialisée
6. Garde le sens original mais améliore la formulation

STYLE D'ÉCRITURE :
- Phrases courtes et précises
- Vocabulaire technique approprié
- Pas de jugement de valeur
- Observations factuelles uniquement

🔎 Informations sur le jeune concerné :
- Prénom : ${youngProfile?.first_name || 'Non renseigné'}
- Nom : ${youngProfile?.last_name || 'Non renseigné'}
- Date de naissance : ${youngProfile?.birth_date || 'Non renseignée'}
- Structure : ${youngProfile?.structure || 'Non renseignée'}`;

    console.log('System prompt:', systemPrompt);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Voici la transcription brute de l'observation orale à reformuler :
"""${transcriptionText}"""

Consignes :
- Reformule le contenu pour qu'il soit lisible et professionnel
- Supprime les hésitations, répétitions ou formulations orales
- Si le contenu est incohérent ou incompréhensible, signale-le clairement avec "[INCOHÉRENCE DÉTECTÉE]" au début
- Écris au présent de manière neutre et concise
- Remplace "le jeune" par le prénom du jeune concerné (${youngProfile?.first_name || 'Non renseigné'})
- Garde le sens exact des propos de l'éducateur, ne déforme rien`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const result = await response.json();
    console.log('OpenAI response received, content length:', result.choices[0].message.content.length);
    finalText = result.choices[0].message.content;
    
    // Re-check the reformulated text for errors marked by the AI
    const hasMarkedError = finalText.includes("[INCOHÉRENCE DÉTECTÉE]");
    
    // Vérifier à nouveau si la reformulation contient des incohérences
    const finalCoherenceCheck = await validateTranscriptionCoherence(finalText, youngProfile);
    
    return {
      text: finalText,
      raw_text: transcriptionText,
      hasError: !coherenceCheck.isValid || hasMarkedError || !finalCoherenceCheck.isValid,
      errorMessage: hasMarkedError ? 
        "Le modèle AI a détecté des incohérences dans le contenu." : 
        !finalCoherenceCheck.isValid ? finalCoherenceCheck.message : coherenceCheck.message,
      inconsistencies: [...coherenceCheck.inconsistencies, ...finalCoherenceCheck.inconsistencies]
    };
  } catch (error) {
    console.error('Error reformulating with GPT-4o:', error);
    // Fallback : return original text with error status
    return { 
      text: transcriptionText, 
      raw_text: transcriptionText,
      hasError: true,
      errorMessage: `Erreur lors de la reformulation: ${error.message}`,
      inconsistencies: ["Erreur technique lors de la reformulation"]
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Vérifier l'authentification
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ 
        error: "Non autorisé. Authentification requise.",
        code: "auth_required" 
      }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    console.log('Request received');
    
    const requestData = await req.json();
    const { audio, youngProfile } = requestData;
    
    console.log('Request data parsed, audio length:', audio?.length || 0);
    console.log('Young profile present:', !!youngProfile);
    
    if (!audio) {
      return new Response(
        JSON.stringify({ 
          error: "No audio data provided",
          code: "missing_audio" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if OpenAI API key is configured
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({ 
          error: "OpenAI API key not configured. Please configure the OPENAI_API_KEY in your Supabase project settings.",
          code: "missing_api_key" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Processing audio data, length:', audio.length);

    try {
      // Process audio in chunks
      const binaryAudio = processBase64Chunks(audio);
      console.log('Binary audio processed, size:', binaryAudio.length, 'bytes');
      
      // Prepare form data for Whisper
      const formData = new FormData();
      const blob = new Blob([binaryAudio], { type: 'audio/webm' });
      formData.append('file', blob, 'audio.webm');
      formData.append('model', 'whisper-1');
      
      console.log('Sending request to OpenAI Whisper API...');

      // Get raw transcription from Whisper
      const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: formData,
      });

      if (!whisperResponse.ok) {
        const errorText = await whisperResponse.text();
        console.error('Whisper API error response:', errorText);
        throw new Error(`Whisper API error: ${errorText}`);
      }

      const whisperResult = await whisperResponse.json();
      const rawTranscription = whisperResult.text;
      
      console.log('Raw transcription received, length:', rawTranscription?.length || 0);

      if (!rawTranscription || rawTranscription.trim() === '') {
        return new Response(
          JSON.stringify({ 
            error: "Aucun texte détecté dans l'enregistrement. Veuillez parler plus fort ou vous rapprocher du microphone.",
            code: "empty_transcription" 
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Reformulate with GPT-4o
      console.log('Got raw transcription, reformulating...');
      const reformulationResult = await reformulateTranscription(rawTranscription, youngProfile);

      return new Response(
        JSON.stringify({ 
          text: reformulationResult.text,
          raw_text: reformulationResult.raw_text || rawTranscription,
          hasError: reformulationResult.hasError,
          errorMessage: reformulationResult.errorMessage,
          inconsistencies: reformulationResult.inconsistencies || []
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } catch (audioError) {
      console.error('Audio processing error:', audioError);
      return new Response(
        JSON.stringify({ 
          error: "Erreur lors du traitement de l'audio: " + (audioError instanceof Error ? audioError.message : "erreur inconnue"), 
          code: "audio_processing_error"
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

  } catch (error) {
    console.error('Transcription error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Erreur de transcription: " + (error instanceof Error ? error.message : "erreur inconnue"), 
        code: "transcription_error"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
