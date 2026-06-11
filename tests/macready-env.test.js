import { describe, expect, it } from "vitest";
import { hostCapabilities, resolveDataUrl } from "../lib/macready-env.mjs";

describe("macready env helpers", () => {
  it("marks github.io as static-only", () => {
    const caps = hostCapabilities("alyx-ml.github.io");
    expect(caps.staticOnly).toBe(true);
    expect(caps.rssProxy).toBe(false);
  });

  it("enables worker APIs on Cloudflare hosts", () => {
    const caps = hostCapabilities("macosmacready.example.workers.dev");
    expect(caps.staticOnly).toBe(false);
    expect(caps.crossoverLive).toBe(true);
  });

  it("resolves data URLs from a base path", () => {
    expect(resolveDataUrl("news.generated.json")).toBe("/data/news.generated.json");
  });
});
