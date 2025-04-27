
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

async function reformulateTranscription(transcriptionText: string, youngProfile: any) {
  try {
    console.log('Reformulating transcription with GPT-4o...');
    console.log('Young profile data:', JSON.stringify(youngProfile || {}));
    
    // Vérifier que la clé API OpenAI est disponible
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OpenAI API key not available for reformulation');
      return transcriptionText; // Fallback: return original text
    }
    
    // Calculer l'âge si la date de naissance est disponible
    let age = 'Non renseigné';
    if (youngProfile?.birth_date) {
      const birthYear = new Date(youngProfile.birth_date).getFullYear();
      const currentYear = new Date().getFullYear();
      age = (currentYear - birthYear).toString();
    }
    
    const systemPrompt = `Tu es un assistant d'écriture destiné aux éducateurs spécialisés.
Tu aides à transformer une transcription vocale en une note professionnelle claire, synthétique et bien formulée.

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
- Garde le sens exact des propos de l'éducateur
- Écris au présent de manière neutre et concise
- Ne déforme rien : reformule sans interpréter`
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
    return result.choices[0].message.content;
  } catch (error) {
    console.error('Error reformulating with GPT-4o:', error);
    // Fallback : return original text
    return transcriptionText;
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
      const reformulatedText = await reformulateTranscription(rawTranscription, youngProfile);

      return new Response(
        JSON.stringify({ 
          text: reformulatedText,
          raw_text: rawTranscription // Include raw text for debugging
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
