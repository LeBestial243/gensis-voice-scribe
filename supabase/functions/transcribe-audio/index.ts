
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { audio } = await req.json()
    
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
          status: 400, // Changed from 500 to 400 for better client handling
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Processing audio data, length:', audio.length)

    try {
      // Process audio in chunks
      const binaryAudio = processBase64Chunks(audio)
      console.log('Binary audio processed, size:', binaryAudio.length, 'bytes')
      
      // Prepare form data
      const formData = new FormData()
      const blob = new Blob([binaryAudio], { type: 'audio/webm' })
      formData.append('file', blob, 'audio.webm')
      formData.append('model', 'whisper-1')
      
      console.log('Sending request to OpenAI API...')

      // Send to OpenAI
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('OpenAI API error:', errorText)
        
        let errorMessage = 'Error communicating with OpenAI API'
        let errorCode = 'api_error'
        
        try {
          const errorJson = JSON.parse(errorText)
          // Handle specific error codes
          if (errorJson?.error?.code === 'insufficient_quota') {
            errorMessage = 'Votre quota OpenAI est dépassé. Veuillez vérifier votre plan et vos détails de facturation.'
            errorCode = 'insufficient_quota'
          } else if (errorJson?.error?.message) {
            errorMessage = errorJson.error.message
            errorCode = errorJson?.error?.code || 'api_error'
          }
        } catch (e) {
          // If JSON parsing fails, use the raw error text
          errorMessage = errorText || 'Unknown API error'
        }
        
        return new Response(
          JSON.stringify({ 
            error: errorMessage, 
            code: errorCode
          }),
          {
            status: 200, // Return 200 with error in body for better client handling
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const result = await response.json()
      console.log('Transcription result:', result)
      
      // Check if the transcription is empty
      if (!result.text || result.text.trim() === '') {
        console.warn('Empty transcription received')
        return new Response(
          JSON.stringify({ 
            error: "Aucun texte détecté dans l'enregistrement. Veuillez parler plus fort ou vous rapprocher du microphone.",
            code: "empty_transcription" 
          }),
          {
            status: 200, // Not an error, just empty
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      return new Response(
        JSON.stringify({ text: result.text }),
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
          status: 200, // Return 200 with error in body for better client handling
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
        status: 200, // Return 200 with error in body for better client handling
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
