import { describe, expect, it } from "vitest";

function isPodcastFeedEntry(title, subtitle = "", content = "", link = "") {
  const clean = value => String(value || "").replace(/\s+/g, " ").trim();
  const strip = value => clean(String(value || "").replace(/<[^>]+>/g, " "));
  const titleLower = clean(title).toLowerCase();
  const subtitleLower = clean(subtitle).toLowerCase();
  const contentLower = strip(content).toLowerCase();
  const linkLower = String(link || "").toLowerCase();
  const combined = `${titleLower} ${subtitleLower} ${contentLower}`;

  if (titleLower.includes("podcast rewind")) return true;
  if (titleLower.includes("macstories weekly")) return true;
  if (linkLower.includes("/podcast-rewind") || linkLower.includes("/podcast/episode") || linkLower.includes("/feed/podcast")) {
    return true;
  }
  if (subtitleLower.startsWith("enjoy the latest episodes from") || contentLower.startsWith("enjoy the latest episodes from")) {
    return true;
  }
  if (combined.includes("recap of") && combined.includes("articles and podcasts")) return true;
  if (titleLower.startsWith("podcast:") || titleLower.startsWith("listen now:") || titleLower.startsWith("watch:")) {
    return true;
  }

  return false;
}

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
