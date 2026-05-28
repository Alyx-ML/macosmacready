const TRANSCRIBE_MODEL = "@cf/openai/whisper";
const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

export async function onRequestPost({ request, env }) {
  if (!env.AI) {
    return json({ error: "Siri voice AI is not configured." }, 500, request);
  }

  const audioBuffer = await request.arrayBuffer();
  if (!audioBuffer.byteLength) {
    return json({ error: "No voice audio was recorded." }, 400, request);
  }
  if (audioBuffer.byteLength > MAX_AUDIO_BYTES) {
    return json({ error: "Voice recording is too long." }, 413, request);
  }

  let result;
  try {
    result = await env.AI.run(TRANSCRIBE_MODEL, {
      audio: [...new Uint8Array(audioBuffer)]
    });
  } catch (error) {
    return json({
      error: "Voice transcription failed.",
      detail: String(error?.message || error || "").slice(0, 240)
    }, 502, request);
  }

  const text = extractTranscriptionText(result);
  if (!text) {
    return json({ error: "I could not hear any speech." }, 422, request);
  }

  return json({ text }, 200, request);
}

export function onRequestOptions({ request } = {}) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request)
  });
}

function json(payload, status = 200, request) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(request)
    }
  });
}

function corsHeaders(request) {
  return {
    "Access-Control-Allow-Origin": getAllowedOrigin(request),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function getAllowedOrigin(request) {
  const origin = request?.headers?.get("Origin") || "";
  const allowedOrigins = new Set([
    "https://alyx-ml.github.io",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
  ]);
  return allowedOrigins.has(origin) ? origin : "https://alyx-ml.github.io";
}

function extractTranscriptionText(result) {
  if (typeof result?.text === "string") return result.text.trim();
  if (typeof result?.transcription === "string") return result.transcription.trim();
  if (typeof result?.response === "string") return result.response.trim();
  if (typeof result?.result?.text === "string") return result.result.text.trim();
  if (typeof result?.result?.transcription === "string") return result.result.transcription.trim();
  return "";
}
