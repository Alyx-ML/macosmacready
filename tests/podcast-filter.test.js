import { describe, expect, it } from "vitest";
import { isPodcastFeedEntry } from "../lib/news-filters.mjs";

describe("podcast feed filter", () => {
  it("rejects MacStories podcast roundups", () => {
    expect(isPodcastFeedEntry(
      "Podcast Rewind: Automation Wishes, RG Rotate Impressions",
      "Enjoy the latest episodes from MacStories’ family of podcasts: AppStories",
      "<p>Enjoy the latest episodes from MacStories’ family of podcasts:</p>",
      "https://www.macstories.net/news/podcast-rewind-automation-wishes/"
    )).toBe(true);
  });

  it("keeps legitimate news about podcasts", () => {
    expect(isPodcastFeedEntry(
      "Jason Snell Launches Designed in California Podcast Kickstarter",
      "Today I’m incredibly excited to announce that Myke Hurley and I are launching a Kickstarter for a new podcast",
      "<p>Today I’m incredibly excited to announce that Myke Hurley and I are launching a Kickstarter for a new podcast</p>",
      "https://sixcolors.com/post/2026/05/designed-in-california/"
    )).toBe(false);
  });
});
