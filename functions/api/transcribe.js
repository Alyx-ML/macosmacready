const TRANSCRIBE_MODEL = "@cf/openai/whisper-large-v3-turbo";
const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

export async function onRequestPost({ request, env }) {
  if (!env.AI) {
    return json({ error: "Siri voice AI is not configured." }, 500);
  }

  const audioBuffer = await request.arrayBuffer();
  if (!audioBuffer.byteLength) {
    return json({ error: "No voice audio was recorded." }, 400);
  }
  if (audioBuffer.byteLength > MAX_AUDIO_BYTES) {
    return json({ error: "Voice recording is too long." }, 413);
  }

  const result = await env.AI.run(TRANSCRIBE_MODEL, {
    audio: [...new Uint8Array(audioBuffer)]
  });

  const text = extractTranscriptionText(result);
  if (!text) {
    return json({ error: "I could not hear any speech." }, 422);
  }

  return json({ text });
}

export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders()
    }
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "https://alyx-ml.github.io",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function extractTranscriptionText(result) {
  if (typeof result?.text === "string") return result.text.trim();
  if (typeof result?.transcription === "string") return result.transcription.trim();
  if (typeof result?.response === "string") return result.response.trim();
  if (typeof result?.result?.text === "string") return result.result.text.trim();
  if (typeof result?.result?.transcription === "string") return result.result.transcription.trim();
  return "";
}
