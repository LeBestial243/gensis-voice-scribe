import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

async function validateTranscriptionCoherence(transcriptionText: string) {
  const errorKeywords = [
    "incohérence", "impossible", "incorrect", "invalide", 
    "erreur", "problème", "incompréhensible", "confusion",
    "inaudible", "interférence", "ne comprend pas", "mots manquants",
    "vérifier", "incomplet", "incertain"
  ];
  
  const hasErrors = errorKeywords.some(keyword => 
    transcriptionText.toLowerCase().includes(keyword.toLowerCase())
  );
  
  return {
    isValid: !hasErrors,
    message: hasErrors ? 
      "La transcription semble contenir des incohérences. Veuillez vérifier le contenu." : 
      "Transcription valide"
  };
}

async function reformulateTranscription(transcriptionText: string, youngProfile: any) {
  try {
    console.log('Reformulating transcription with GPT-4o...');
    console.log('Young profile data:', JSON.stringify(youngProfile || {}));
    
    // Vérifier la cohérence avant la reformulation
    const coherenceCheck = await validateTranscriptionCoherence(transcriptionText);
    let finalText = transcriptionText;
    
    // Vérifier que la clé API OpenAI est disponible
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OpenAI API key not available for reformulation');
      return { 
        text: transcriptionText,
        hasError: !coherenceCheck.isValid,
        errorMessage: coherenceCheck.message
      }; // Fallback: return original text
    }
    
    // Calculer l'âge si la date de naissance est disponible
    let age = 'Non renseigné';
    if (youngProfile?.birth_date) {
      const birthYear = new Date(youngProfile.birth_date).getFullYear();
      const currentYear = new Date().getFullYear();
      age = (currentYear - birthYear).toString();
    }
    
    const systemPrompt = `Tu es un assistant d'écriture pour éducateurs spécialisés.
Ta mission est de transformer une transcription vocale en une note professionnelle structurée.

RÈGLES IMPÉRATIVES :
1. Utilise un vocabulaire professionnel de l'éducation spécialisée
2. Structure le texte avec des paragraphes clairs
3. Corrige toute incohérence ou erreur de langage
4. Si le contenu est incohérent, signale-le clairement avec "[INCOHÉRENCE DÉTECTÉE]" au début et explique pourquoi
5. Maintiens un ton neutre et factuel
6. Organise les informations de manière logique et chronologique

STYLE D'ÉCRITURE :
- Phrases courtes et précises
- Vocabulaire technique approprié
- Pas de jugement de valeur
- Observations factuelles uniquement

🔎 Informations sur le jeune concerné :
- Prénom : ${youngProfile?.first_name || 'Non renseigné'}
- Nom : ${youngProfile?.last_name || 'Non renseigné'}
- Âge : ${age} ans
- Date de naissance : ${youngProfile?.birth_date || 'Non renseignée'}
- Structure : ${youngProfile?.structure || 'Non renseignée'}
- Projet éducatif : ${youngProfile?.project || 'Non renseigné'}`;

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
    
    return {
      text: finalText,
      hasError: !coherenceCheck.isValid || hasMarkedError,
      errorMessage: hasMarkedError ? 
        "Le modèle AI a détecté des incohérences dans le contenu." : coherenceCheck.message
    };
  } catch (error) {
    console.error('Error reformulating with GPT-4o:', error);
    // Fallback : return original text with error status
    return { 
      text: transcriptionText, 
      hasError: true,
      errorMessage: `Erreur lors de la reformulation: ${error.message}`
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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
          raw_text: rawTranscription,
          hasError: reformulationResult.hasError,
          errorMessage: reformulationResult.errorMessage
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
