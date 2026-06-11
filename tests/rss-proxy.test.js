import { describe, expect, it } from "vitest";
import { isAllowedFeedUrl } from "../functions/api/rss-proxy.js";

describe("rss proxy allowlist", () => {
  it("allows known feed hosts", () => {
    expect(isAllowedFeedUrl("https://9to5mac.com/guides/mac/feed/")).toBe(true);
    expect(isAllowedFeedUrl("https://www.iclarified.com/rss/news.xml")).toBe(true);
    expect(isAllowedFeedUrl("https://store.steampowered.com/search/results/")).toBe(true);
    expect(isAllowedFeedUrl("https://www.youtube.com/feeds/videos.xml?channel_id=UCk-DkoUmqZUn2VHL3Eawm6g")).toBe(true);
  });

  it("blocks private and loopback targets", () => {
    expect(isAllowedFeedUrl("http://127.0.0.1/secret")).toBe(false);
    expect(isAllowedFeedUrl("http://localhost/admin")).toBe(false);
    expect(isAllowedFeedUrl("file:///etc/passwd")).toBe(false);
  });
});
