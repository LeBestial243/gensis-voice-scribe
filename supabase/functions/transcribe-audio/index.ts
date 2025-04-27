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

async function reformulateWithGPT4(text: string, youngProfile: any) {
  try {
    const age = calculateAge(youngProfile.birth_date);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Tu es un assistant d'écriture destiné aux éducateurs spécialisés.
Tu aides à transformer une transcription vocale en une note professionnelle claire, synthétique et bien formulée.

🔎 Informations sur le jeune concerné :
- Prénom : ${youngProfile.first_name}
- Nom : ${youngProfile.last_name}
- Âge : ${age} ans
- Date de naissance : ${youngProfile.birth_date}
- Structure : ${youngProfile.structure}
- Projet éducatif : ${youngProfile.project || 'Non renseigné'}

🎙️ Voici la transcription brute de l'observation orale :
"""${text}"""

📝 Consignes :
- Reformule le contenu pour qu'il soit lisible et professionnel
- Supprime les hésitations, répétitions ou formulations orales
- Garde le sens exact des propos de l'éducateur
- Écris au présent de manière neutre et concise
- Ne déforme rien : reformule sans interpréter`
          }
        ],
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      throw new Error(`GPT-4 API error: ${await response.text()}`);
    }

    const result = await response.json();
    return result.choices[0].message.content;
  } catch (error) {
    console.error('Error in GPT-4 reformulation:', error);
    return null; // Fallback to original text
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
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { audio, youngProfile } = await req.json()
    
    if (!audio || !youngProfile) {
      return new Response(
        JSON.stringify({ 
          error: !audio ? "No audio data provided" : "No profile data provided",
          code: !audio ? "missing_audio" : "missing_profile"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if OpenAI API key is configured
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.error('OpenAI API key not configured')
      return new Response(
        JSON.stringify({ 
          error: "OpenAI API key not configured. Please configure the OPENAI_API_KEY in your Supabase project settings.",
          code: "missing_api_key" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Processing audio data, length:', audio.length)

    try {
      // Process audio in chunks
      const binaryAudio = processBase64Chunks(audio)
      console.log('Binary audio processed, size:', binaryAudio.length, 'bytes')
      
      // Prepare form data for Whisper
      const formData = new FormData()
      const blob = new Blob([binaryAudio], { type: 'audio/webm' })
      formData.append('file', blob, 'audio.webm')
      formData.append('model', 'whisper-1')
      
      console.log('Sending request to OpenAI Whisper API...')

      // Send to OpenAI Whisper
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('OpenAI Whisper API error:', errorText)
        throw new Error(errorText)
      }

      const result = await response.json()
      console.log('Whisper transcription result:', result)
      
      // Check if the transcription is empty
      if (!result.text || result.text.trim() === '') {
        console.warn('Empty transcription received')
        return new Response(
          JSON.stringify({ 
            error: "Aucun texte détecté dans l'enregistrement. Veuillez parler plus fort ou vous rapprocher du microphone.",
            code: "empty_transcription" 
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Reformulate with GPT-4
      console.log('Reformulating with GPT-4...')
      const reformulatedText = await reformulateWithGPT4(result.text, youngProfile)

      // Use reformulated text if available, otherwise fallback to original
      const finalText = reformulatedText || result.text
      console.log('Final text:', finalText)

      return new Response(
        JSON.stringify({ text: finalText }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } catch (audioError) {
      console.error('Audio processing error:', audioError)
      return new Response(
        JSON.stringify({ 
          error: "Erreur lors du traitement de l'audio: " + (audioError instanceof Error ? audioError.message : "erreur inconnue"), 
          code: "audio_processing_error"
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

  } catch (error) {
    console.error('Transcription error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: "Erreur de transcription: " + (error instanceof Error ? error.message : "erreur inconnue"), 
        code: "transcription_error"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
