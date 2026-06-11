import { mkdir, writeFile } from "node:fs/promises";
import { lookupCrossoverCompatibility } from "../functions/api/crossover-compatibility.js";

const searchUrls = [
  "https://store.steampowered.com/search/results/?query&start=0&count=100&dynamic_data=&sort_by=_ASC&force_infinite=1&filter=topsellers&category1=998&ndl=1",
  "https://store.steampowered.com/search/results/?query&start=100&count=100&dynamic_data=&sort_by=_ASC&force_infinite=1&filter=topsellers&category1=998&ndl=1",
  "https://store.steampowered.com/search/results/?query&start=0&count=100&dynamic_data=&sort_by=Released_DESC&force_infinite=1&filter=popularnew&category1=998&ndl=1",
  "https://store.steampowered.com/search/results/?query&start=100&count=100&dynamic_data=&sort_by=Released_DESC&force_infinite=1&filter=popularnew&category1=998&ndl=1",
  "https://store.steampowered.com/search/results/?query&start=0&count=100&dynamic_data=&sort_by=_ASC&force_infinite=1&filter=popularnew&category1=998&ndl=1",
  "https://store.steampowered.com/search/results/?query&start=100&count=100&dynamic_data=&sort_by=_ASC&force_infinite=1&filter=popularnew&category1=998&ndl=1",
  "https://store.steampowered.com/search/results/?query&start=0&count=100&dynamic_data=&sort_by=Released_DESC&force_infinite=1&filter=comingsoon&category1=998&ndl=1"
];

const pinnedAppIds = [3357650, 3124540, 3164500, 730];
const maxGames = Number(process.env.MACREADY_STEAM_GAME_LIMIT || 240);

function decodeHtml(value = "") {
  return String(value)
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanText(value = "") {
  return decodeHtml(String(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function attr(html, name) {
  const match = String(html).match(new RegExp(`${name}="([^"]*)"`, "i"));
  return decodeHtml(match?.[1] || "");
}

function parseSearchRows(html) {
  const rows = [];
  const pattern = /<a\b[^>]*class="[^"]*\bsearch_result_row\b[^"]*"[\s\S]*?<\/a>/gi;
  let match;

  while ((match = pattern.exec(html))) {
    const row = match[0];
    const appid = Number(attr(row, "data-ds-appid"));
    if (!appid) continue;

    const title = cleanText((row.match(/<span[^>]*class="title"[^>]*>([\s\S]*?)<\/span>/i) || [])[1] || "");
    const cover = attr((row.match(/<img\b[^>]*>/i) || [])[0] || "", "src") || attr((row.match(/<img\b[^>]*>/i) || [])[0] || "", "data-src");
    const releaseDate = cleanText((row.match(/<div[^>]*class="[^"]*\bsearch_released\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i) || [])[1] || "");
    const priceBlock = (row.match(/<div[^>]*class="[^"]*\bsearch_price_discount_combined\b[^"]*"[^>]*>/i) || [])[0] || "";
    const finalCents = Number(attr(priceBlock, "data-price-final"));
    const discount = Number(attr((row.match(/<div[^>]*class="[^"]*\bdiscount_block\b[^"]*"[^>]*>/i) || [])[0] || "", "data-discount")) || 0;
    const hasNativeMac = /\bplatform_img mac\b/.test(row);

    rows.push({
      appid,
      title: title || `App ${appid}`,
      cover,
      releaseDate,
      price: Number.isFinite(finalCents) && finalCents > 0 ? finalCents / 100 : 0,
      discount,
      hasNativeMac
    });
  }

  return rows;
}

function pickMovie(data) {
  const movie = (data.movies || []).find(item => item.hls_h264 || item.mp4 || item.webm);
  if (!movie) return null;
  return {
    url: movie.hls_h264 || movie.mp4?.max || movie.mp4?.["480"] || movie.webm?.max || movie.webm?.["480"] || "",
    poster: movie.thumbnail || ""
  };
}

function simplify(appid, search, data) {
  return {
    id: `game-${appid}`,
    appid,
    title: data.name || search?.title || `App ${appid}`,
    rating: null,
    activePlayers: null,
    price: data.price_overview?.initial ? data.price_overview.initial / 100 : (search?.price || 0),
    discount: data.price_overview?.discount_percent || search?.discount || 0,
    hasNativeMac: !!data.platforms?.mac,
    genres: (data.genres || []).map(item => item.description).filter(Boolean).slice(0, 4),
    cover: data.header_image || search?.cover || `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`,
    storeUrl: `https://store.steampowered.com/app/${appid}/`,
    steamdbUrl: `https://steamdb.info/app/${appid}/`,
    protonUrl: `https://www.protondb.com/app/${appid}`,
    fullDescription: data.short_description || "",
    screenshots: (data.screenshots || []).map(item => item.path_full).filter(Boolean).slice(0, 8),
    features: (data.categories || []).map(item => item.description).filter(Boolean).slice(0, 10),
    systemRequirements: {
      mac: data.mac_requirements || null,
      windows: data.pc_requirements || null
    },
    releaseDate: data.release_date?.date || search?.releaseDate || "",
    comingSoon: !!data.release_date?.coming_soon,
    developer: (data.developers || []).join(", "),
    publisher: (data.publishers || []).join(", "),
    videoUrl: pickMovie(data)?.url || "",
    videoPoster: pickMovie(data)?.poster || "",
    crossoverCompatibility: null
  };
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "accept": "text/html,application/json",
      "user-agent": "MacReady generated games data"
    }
  });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.text();
}

async function main() {
  const searchGames = [];

  for (const url of searchUrls) {
    const html = await fetchText(url);
    searchGames.push(...parseSearchRows(html));
  }

  const byId = new Map();
  for (const game of searchGames) byId.set(game.appid, game);
  for (const appid of pinnedAppIds) byId.set(appid, byId.get(appid) || { appid });

  const games = [];
  const appids = [
    ...pinnedAppIds,
    ...[...byId.keys()].filter(appid => !pinnedAppIds.includes(appid))
  ].slice(0, maxGames);

  for (const appid of appids) {
    try {
      const json = JSON.parse(await fetchText(`https://store.steampowered.com/api/appdetails?appids=${appid}&l=english&cc=US`));
      const data = json?.[appid]?.data;
      if (data) {
        const game = simplify(appid, byId.get(appid), data);
        try {
          game.crossoverCompatibility = await lookupCrossoverCompatibility(game.title);
        } catch {
          game.crossoverCompatibility = {
            found: false,
            reason: "lookup_failed",
            query: game.title
          };
        }
        games.push(game);
      }
    } catch (error) {
      console.warn(`Skipping ${appid}: ${error.message}`);
    }
  }

  await mkdir("public/data", { recursive: true });
  await writeFile(
    "public/data/games.generated.js",
    `window.MACREADY_GENERATED_STEAM_GAMES=${JSON.stringify({ generatedAt: new Date().toISOString(), games })};\n`
  );
  console.log(`Generated ${games.length} games`);
}

await main();
