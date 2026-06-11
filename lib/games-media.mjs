/** YouTube ↔ Steam game title matching (pure functions). */

export const USER_VIDEO_MATCH_STOP_WORDS = new Set([
  "the", "a", "an", "of", "and", "or", "for", "to", "on", "in", "at", "with",
  "edition", "definitive", "deluxe", "game", "demo", "mac", "crossover", "native", "port",
  "first", "light", "dark", "new", "old", "pro", "max", "mini", "ultra", "super",
  "playing", "running", "impressions", "gameplay", "review", "guide", "update", "beta"
]);

export function normalizeGameMatchText(text) {
  return String(text || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

export function buildDistinctiveGameTokens(title) {
  return normalizeGameMatchText(title)
    .split(/\s+/)
    .filter(token => {
      if (!token || USER_VIDEO_MATCH_STOP_WORDS.has(token)) return false;
      if (/^\d+$/.test(token)) return true;
      return token.length >= 4;
    });
}

export function tokenMatchesText(token, text) {
  if (!token || !text) return false;
  const pattern = new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  return pattern.test(text);
}

export function countSteamAppLinks(text) {
  return (String(text).match(/store\.steampowered\.com\/app\/\d+/gi) || []).length;
}

export function videoTitleMatchesGame(game, videoTitle) {
  const gameTitle = normalizeGameMatchText(game.title);
  if (gameTitle.length >= 4 && videoTitle.includes(gameTitle)) return true;

  const tokens = buildDistinctiveGameTokens(game.title);
  if (tokens.length === 0) return false;

  if (tokens.every(token => /^\d+$/.test(token))) {
    return gameTitle.length >= 4 && videoTitle.includes(gameTitle);
  }

  return tokens.every(token => tokenMatchesText(token, videoTitle));
}

export function videoMatchesGame(video, game) {
  if (!video || !game?.title) return false;

  const videoTitle = normalizeGameMatchText(video.title);
  const videoDescription = `${video.description || ""} ${video.url || ""}`;

  if (videoTitleMatchesGame(game, videoTitle)) return true;

  if (game.appid) {
    const appidPattern = new RegExp(`store\\.steampowered\\.com/app/${game.appid}\\b`, "i");
    if (appidPattern.test(videoDescription)) {
      return countSteamAppLinks(videoDescription) <= 1 || videoTitleMatchesGame(game, videoTitle);
    }
  }

  return false;
}

export function findUserVideosForGame(game, videos = []) {
  return videos
    .filter(video => videoMatchesGame(video, game))
    .sort((a, b) => Date.parse(b.published || 0) - Date.parse(a.published || 0))
    .slice(0, 6);
}

export function installGamesMedia() {
  if (typeof window === "undefined") return;
  Object.assign(window, {
    normalizeGameMatchText,
    buildDistinctiveGameTokens,
    tokenMatchesText,
    countSteamAppLinks,
    videoTitleMatchesGame,
    videoMatchesGame,
    findUserVideosForGame
  });
}
