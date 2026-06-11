import { describe, expect, it } from "vitest";

const USER_VIDEO_MATCH_STOP_WORDS = new Set([
  "the", "a", "an", "of", "and", "or", "for", "to", "on", "in", "at", "with",
  "edition", "definitive", "deluxe", "game", "demo", "mac", "crossover", "native", "port",
  "first", "light", "dark", "new", "old", "pro", "max", "mini", "ultra", "super",
  "playing", "running", "impressions", "gameplay", "review", "guide", "update", "beta"
]);

function normalizeGameMatchText(text) {
  return String(text || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function buildDistinctiveGameTokens(title) {
  return normalizeGameMatchText(title)
    .split(/\s+/)
    .filter(token => {
      if (!token || USER_VIDEO_MATCH_STOP_WORDS.has(token)) return false;
      if (/^\d+$/.test(token)) return true;
      return token.length >= 4;
    });
}

function tokenMatchesText(token, text) {
  if (!token || !text) return false;
  const pattern = new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  return pattern.test(text);
}

function countSteamAppLinks(text) {
  return (String(text).match(/store\.steampowered\.com\/app\/\d+/gi) || []).length;
}

function videoTitleMatchesGame(game, videoTitle) {
  const gameTitle = normalizeGameMatchText(game.title);
  if (gameTitle.length >= 4 && videoTitle.includes(gameTitle)) return true;

  const tokens = buildDistinctiveGameTokens(game.title);
  if (tokens.length === 0) return false;

  if (tokens.every(token => /^\d+$/.test(token))) {
    return gameTitle.length >= 4 && videoTitle.includes(gameTitle);
  }

  return tokens.every(token => tokenMatchesText(token, videoTitle));
}

function videoMatchesGame(video, game) {
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

describe("user video matching", () => {
  it("matches channel videos by Steam app id in the description", () => {
    expect(videoMatchesGame(
      {
        title: "PRAGMATA Demo on Mac! (CrossOver 26) (M4 Mac Mini)",
        description: "PRAGMATA - https://store.steampowered.com/app/3357650/PRAGMATA/"
      },
      { title: "PRAGMATA", appid: 3357650 }
    )).toBe(true);
  });

  it("matches channel videos by distinctive title tokens", () => {
    expect(videoMatchesGame(
      { title: "Backyard Baseball (2026) Demo on Mac! Native Port! (M4 Mac mini)", description: "" },
      { title: "Backyard Baseball", appid: 3935020 }
    )).toBe(true);
  });

  it("does not match unrelated Mac gaming videos", () => {
    expect(videoMatchesGame(
      { title: "Random Mac gaming news roundup", description: "Lots of games this week" },
      { title: "PRAGMATA", appid: 3357650 }
    )).toBe(false);
  });

  it("does not match generic words from another game's video", () => {
    expect(videoMatchesGame(
      {
        title: "Playing Resident Evil: Requiem on M4 Mac mini! First Impressions (CrossOver 26)",
        description: "First impressions of Resident Evil: Requiem running on a M4 Mac mini. To fix lighting, turn OFF Subsurface Scattering. Resident Evil: Requiem - https://store.steampowered.com/app/3764200/Resident_Evil_Requiem/"
      },
      { title: "007 First Light", appid: 3768760 }
    )).toBe(false);
  });

  it("does not match other resident evil games to a requiem video", () => {
    expect(videoMatchesGame(
      {
        title: "Playing Resident Evil: Requiem on M4 Mac mini! First Impressions (CrossOver 26)",
        description: "Resident Evil: Requiem - https://store.steampowered.com/app/3764200/Resident_Evil_Requiem/"
      },
      { title: "Resident Evil 4", appid: 2050650 }
    )).toBe(false);
  });

  it("ignores roundup descriptions unless the title also matches", () => {
    expect(videoMatchesGame(
      {
        title: "MacBook Neo Gaming - 11 Games Running on Mac!",
        description: "HITMAN - https://store.steampowered.com/app/1659040/\\nPRAGMATA - https://store.steampowered.com/app/3357650/"
      },
      { title: "HITMAN World of Assassination", appid: 1659040 }
    )).toBe(false);
  });
});
