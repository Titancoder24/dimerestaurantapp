import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { imageUrl, bucket, prefix } = await req.json();

    if (!imageUrl || !bucket || !prefix) {
      return new Response(JSON.stringify({ error: "Missing imageUrl, bucket, or prefix" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the source image
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch source image" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const imgBlob = await imgResponse.blob();

    // Load the background removal library from CDN (works in Deno runtime)
    const { removeBackground } = await import(
      "https://esm.sh/@imgly/background-removal@1.5.8"
    );

    const resultBlob = await removeBackground(imgBlob, {
      output: { format: "image/png", quality: 0.9 },
    });

    const arrayBuf = await resultBlob.arrayBuffer();
    const filename = `${prefix}/${Date.now()}-nobg.png`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filename, arrayBuf, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      return new Response(JSON.stringify({ error: uploadError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filename);

    return new Response(JSON.stringify({ url: data.publicUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
