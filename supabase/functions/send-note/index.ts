
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, noteTitle, noteContent } = await req.json();

    const { data, error } = await resend.emails.send({
      from: "Notes GENSYS <onboarding@resend.dev>",
      to: [email],
      subject: `Note GENSYS - ${noteTitle}`,
      html: `
        <h1>${noteTitle}</h1>
        <div style="white-space: pre-wrap;">${noteContent}</div>
      `,
    });

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});
