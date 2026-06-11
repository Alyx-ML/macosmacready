import { describe, expect, it } from "vitest";
import { isMacDealArticle } from "../lib/news-filters.mjs";

describe("deal category detection", () => {
  it("promotes real Mac price-drop headlines", () => {
    expect(isMacDealArticle({
      title: "Apple's 2026 M5 MacBook Air plunges to record-low $899",
      subtitle: "Save $200 at Amazon"
    })).toBe(true);
  });

  it("rejects idiomatic deal phrasing in article previews", () => {
    expect(isMacDealArticle({
      title: "I’m using macOS Golden Gate’s Siri on the MacBook Neo. Ask us anything",
      subtitle: "The biggest deal about macOS 27 Golden Gate isn’t the design tweaks"
    })).toBe(false);
  });
});
