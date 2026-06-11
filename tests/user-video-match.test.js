import { describe, expect, it } from "vitest";
import {
  buildDistinctiveGameTokens,
  countSteamAppLinks,
  findUserVideosForGame,
  normalizeGameMatchText,
  tokenMatchesText,
  videoMatchesGame,
  videoTitleMatchesGame
} from "../lib/games-media.mjs";

describe("user video game matching", () => {
  it("matches distinctive multi-token game titles", () => {
    const game = { title: "Hades II", appid: "1145350" };
    const videoTitle = normalizeGameMatchText("Playing Hades II on Mac with CrossOver");
    expect(videoTitleMatchesGame(game, videoTitle)).toBe(true);
  });

  it("rejects unrelated videos with overlapping generic words", () => {
    const game = { title: "Portal 2", appid: "620" };
    const video = {
      title: "Portal review for Windows gaming",
      description: "A look at classic puzzle games",
      url: "https://www.youtube.com/watch?v=example"
    };
    expect(videoMatchesGame(video, game)).toBe(false);
  });

  it("matches by Steam app link when title tokens align", () => {
    const game = { title: "Civilization VI", appid: "289070" };
    const video = {
      title: "Civilization VI on Apple Silicon",
      description: "https://store.steampowered.com/app/289070",
      url: "https://www.youtube.com/watch?v=abc"
    };
    expect(videoMatchesGame(video, game)).toBe(true);
  });

  it("limits duplicate Steam links in roundup videos", () => {
    const game = { title: "Stardew Valley", appid: "413150" };
    const video = {
      title: "Top 10 Mac games this week",
      description: [
        "https://store.steampowered.com/app/413150",
        "https://store.steampowered.com/app/999999"
      ].join(" "),
      url: "https://www.youtube.com/watch?v=roundup"
    };
    expect(videoMatchesGame(video, game)).toBe(false);
  });

  it("builds distinctive tokens and sorts newest matches first", () => {
    expect(buildDistinctiveGameTokens("The Witcher 3: Wild Hunt")).toContain("witcher");
    expect(tokenMatchesText("witcher", "the witcher 3 wild hunt demo")).toBe(true);
    expect(countSteamAppLinks("https://store.steampowered.com/app/1 https://store.steampowered.com/app/2")).toBe(2);

    const game = { title: "Baldur's Gate 3", appid: "1086940" };
    const videos = [
      { title: "Baldur's Gate 3 native on Mac", published: "2026-01-01T00:00:00Z", url: "https://youtu.be/old" },
      { title: "Baldur's Gate 3 CrossOver impressions", published: "2026-06-01T00:00:00Z", url: "https://youtu.be/new" }
    ];
    const matches = findUserVideosForGame(game, videos);
    expect(matches[0].url).toBe("https://youtu.be/new");
    expect(matches).toHaveLength(2);
  });
});
