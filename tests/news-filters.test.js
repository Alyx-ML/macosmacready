import { describe, expect, it } from "vitest";
import { shouldIncludeRSSArticle } from "../lib/news-filters.mjs";

describe("shouldIncludeRSSArticle", () => {
  it("does not throw for iOS-led technology headlines before ecosystem check", () => {
    expect(() => shouldIncludeRSSArticle(
      { name: "9to5Mac", category: "technology" },
      "iPhone 17 Pro gets a new camera",
      "Apple announced updates for the iPhone lineup.",
      "<p>iPhone news</p>"
    )).not.toThrow();
  });

  it("allows iClarified Apple ecosystem headlines without Mac-specific terms", () => {
    expect(shouldIncludeRSSArticle(
      { name: "iClarified", category: "technology" },
      "Apple announces iOS 27 features at WWDC",
      "Apple shared software updates for iPhone and iPad.",
      "<p>Apple WWDC</p>"
    )).toBe(true);
  });
});
