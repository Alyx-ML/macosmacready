const AI_MODEL = "@cf/google/gemma-4-26b-a4b-it";

const WEATHER_CODES = {
  0: "clear",
  1: "mainly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "foggy",
  48: "foggy",
  51: "light drizzle",
  53: "drizzle",
  55: "heavy drizzle",
  61: "light rain",
  63: "rain",
  65: "heavy rain",
  71: "light snow",
  73: "snow",
  75: "heavy snow",
  80: "light showers",
  81: "showers",
  82: "heavy showers",
  95: "thunderstorms"
};

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const message = String(body.message || "").trim().slice(0, 1200);
  const context = body.context && typeof body.context === "object" ? body.context : {};

  if (!message) {
    return json({ reply: "Ask me a question or tell me what you want to do." }, 400, request);
  }

  if (isWeatherQuery(message)) {
    return json({ reply: await answerWeather(message, request) }, 200, request);
  }

  if (!env.AI) {
    return json({ reply: "Siri AI is not configured yet. Add a Cloudflare Workers AI binding named AI." }, 500, request);
  }

  let result;
  try {
    result = await env.AI.run(AI_MODEL, {
      messages: [
        {
          role: "system",
          content: [
            "You are Siri inside MacReady, a macOS-style web desktop.",
            "Answer in plain language. Be concise, helpful, and calm.",
            "Start directly with the answer.",
            "Do not describe the user's request.",
            "Do not include reasoning, analysis, or hidden notes.",
            "Do not pretend to have live data unless it is provided in the context.",
            "If asked what a product, technology, event, or company is, answer as a normal general-knowledge question.",
            "If the user asks for current weather, tell them to include a city if no city was provided.",
            "Use the app context only when it helps."
          ].join(" ")
        },
        {
          role: "user",
          content: `Context: ${JSON.stringify(context).slice(0, 2500)}\n\nUser: ${message}`
        }
      ],
      max_tokens: 500,
      temperature: 0.4
    });
  } catch (error) {
    return json({
      reply: "Siri could not reach the AI service.",
      detail: String(error?.message || error || "").slice(0, 240)
    }, 502, request);
  }

  const reply = extractAiText(result);
  if (!reply) {
    return json({ reply: "Siri did not receive a text response from the AI service." }, 502, request);
  }

  return json({ reply }, 200, request);
}

export function onRequestGet() {
  return json({ reply: "Siri is ready. Send a POST request with a message." });
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
      "Cache-Control": "no-store",
      ...corsHeaders(request)
    }
  });
}

function corsHeaders(request) {
  return {
    "Access-Control-Allow-Origin": getAllowedOrigin(request),
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

function extractAiText(result) {
  if (typeof result?.response === "string") return result.response.trim();
  if (typeof result?.text === "string") return result.text.trim();
  if (typeof result?.output_text === "string") return result.output_text.trim();
  if (typeof result?.content === "string") return result.content.trim();
  if (typeof result?.message?.content === "string") return result.message.content.trim();
  if (typeof result?.choices?.[0]?.message?.content === "string") return result.choices[0].message.content.trim();
  if (typeof result?.choices?.[0]?.text === "string") return result.choices[0].text.trim();
  if (typeof result?.result?.response === "string") return result.result.response.trim();
  if (typeof result?.result?.text === "string") return result.result.text.trim();
  if (typeof result?.result?.content === "string") return result.result.content.trim();
  if (typeof result?.result?.choices?.[0]?.message?.content === "string") {
    return result.result.choices[0].message.content.trim();
  }
  if (Array.isArray(result?.output)) {
    const text = result.output
      .flatMap(item => typeof item === "string" ? [item] : item.content || [])
      .map(part => typeof part === "string" ? part : part.text || part.content || "")
      .join("")
      .trim();
    if (text) return text;
  }
  if (Array.isArray(result?.result?.response)) return result.result.response.join("").trim();
  const nestedText = findGeneratedText(result);
  if (nestedText) return nestedText;
  return "";
}

function findGeneratedText(value, key = "", depth = 0) {
  if (depth > 5 || value == null) return "";

  if (typeof value === "string") {
    const usefulKey = /^(response|text|content|output_text|answer)$/i.test(key);
    return usefulKey && value.trim() ? value.trim() : "";
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string" && item.trim()) return item.trim();
      const text = findGeneratedText(item, key, depth + 1);
      if (text) return text;
    }
    return "";
  }

  if (typeof value === "object") {
    const preferredKeys = ["response", "text", "content", "output_text", "answer", "message", "choices", "output", "result"];
    for (const preferredKey of preferredKeys) {
      if (preferredKey in value) {
        const text = findGeneratedText(value[preferredKey], preferredKey, depth + 1);
        if (text) return text;
      }
    }
  }

  return "";
}

function isWeatherQuery(message) {
  return /\b(weather|forecast|temperature|raining|rain today|sunny today)\b/i.test(message);
}

async function answerWeather(message, request) {
  const explicitLocation = extractWeatherLocation(message);
  if (isCurrentLocationPhrase(explicitLocation)) {
    const location = getCloudflareLocation(request);
    if (!location) {
      return "I could not detect your location. Tell me the city, for example: weather in London.";
    }
    return answerWeatherForLocation(location);
  }

  if (!explicitLocation) {
    return "Tell me the city, for example: weather in London.";
  }

  const location = await geocodeLocation(explicitLocation);
  if (!location) {
    return `I could not find the weather location ${explicitLocation}.`;
  }

  return answerWeatherForLocation(location);
}

async function answerWeatherForLocation(location) {
  const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
  forecastUrl.searchParams.set("latitude", location.latitude);
  forecastUrl.searchParams.set("longitude", location.longitude);
  forecastUrl.searchParams.set("current", "temperature_2m,apparent_temperature,weather_code,wind_speed_10m");
  forecastUrl.searchParams.set("timezone", "auto");

  const forecast = await fetch(forecastUrl).then(response => response.json());
  const current = forecast.current;

  if (!current) {
    return `I could not get the weather for ${location.name}.`;
  }

  const condition = WEATHER_CODES[current.weather_code] || "mixed conditions";
  return `Weather in ${location.name}: ${Math.round(current.temperature_2m)}°C and ${condition}. It feels like ${Math.round(current.apparent_temperature)}°C, with wind around ${Math.round(current.wind_speed_10m)} km/h.`;
}

function isCurrentLocationPhrase(value) {
  return /^(my location|current location|my area|here|near me)$/i.test(String(value || "").trim());
}

function extractWeatherLocation(message) {
  const text = String(message || "").replace(/[“”]/g, "\"").replace(/[’]/g, "'").trim();
  const prepositionMatch = text.match(/\b(?:in|for|at)\s+([a-zA-Z\s,.'-]{2,80})/i);
  if (prepositionMatch) return cleanWeatherLocation(prepositionMatch[1]);

  const keywordMatch = text.match(/\b(?:weather|forecast|temperature)\b\s*(?:today|now|currently|like|please|is|the|for)?\s*([a-zA-Z\s,.'-]{2,80})?/i);
  return keywordMatch ? cleanWeatherLocation(keywordMatch[1] || "") : "";
}

function cleanWeatherLocation(value) {
  return String(value || "")
    .replace(/\b(today|now|currently|please|weather|forecast|temperature)\b/gi, "")
    .replace(/[?.!]+$/g, "")
    .trim();
}

async function geocodeLocation(name) {
  const geocodeUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
  geocodeUrl.searchParams.set("name", name);
  geocodeUrl.searchParams.set("count", "1");
  geocodeUrl.searchParams.set("language", "en");
  geocodeUrl.searchParams.set("format", "json");

  const data = await fetch(geocodeUrl).then(response => response.json());
  const place = data?.results?.[0];
  if (!place) return null;

  return {
    name: [place.name, place.admin1, place.country].filter(Boolean).join(", "),
    latitude: String(place.latitude),
    longitude: String(place.longitude)
  };
}

function getCloudflareLocation(request) {
  const cf = request.cf || {};
  if (!cf.latitude || !cf.longitude) return null;

  return {
    name: [cf.city, cf.region, cf.country].filter(Boolean).join(", ") || "your area",
    latitude: String(cf.latitude),
    longitude: String(cf.longitude)
  };
}
