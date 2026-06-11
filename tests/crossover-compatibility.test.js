import { describe, expect, it } from "vitest";
import {
  chooseBestMatch,
  lookupCrossoverCompatibility,
  parseSearchResults,
  scoreTitleMatch
} from "../functions/api/crossover-compatibility.js";

const SAMPLE_SEARCH_HTML = `
<div id="results">
  <tbody>
    <tr id="key_123">
      <td><a href="/compatibility/crossover/steam/123">Portal 2</a></td>
      <td>Valve</td>
      <td>Jun 1, 2026</td>
      <td><ul><li class="active"></li><li class="active"></li><li class="active"></li><li class="active"></li><li class="active"></li></ul></td>
    </tr>
    <tr id="key_456">
      <td><a href="/compatibility/crossover/steam/456">Portal</a></td>
      <td>Valve</td>
      <td>Jun 1, 2026</td>
      <td><ul><li class="active"></li><li class="active"></li><li class="active"></li><li class="active"></li></ul></td>
    </tr>
  </tbody>
</div>
`;

describe("crossover compatibility parser", () => {
  it("scores exact title matches highest", () => {
    expect(scoreTitleMatch("Portal 2", "Portal 2")).toBe(1);
    expect(scoreTitleMatch("Portal 2", "Portal")).toBeLessThan(1);
  });

  it("chooses the best search result above threshold", () => {
    const results = parseSearchResults(SAMPLE_SEARCH_HTML);
    const match = chooseBestMatch("Portal 2", results);
    expect(match?.title).toBe("Portal 2");
    expect(match?.score).toBeGreaterThanOrEqual(0.84);
  });

  it("returns no_match when confidence is too low", async () => {
    const fetchImpl = async () => ({
      ok: true,
      text: async () => SAMPLE_SEARCH_HTML
    });

    const detailFetch = async (url) => ({
      ok: true,
      text: async () => `
        <h1 class="txt_magenta">Portal 2</h1>
        <span id="var_app_id">123</span>
        <span id="var_app_plnk">portal-2</span>
        <span id="var_medal_mac">5</span>
        <div class="os_Mac">Mac Rating Runs Great Last Tested: 25.0.1 (42)</div>
        <div class="os_Linux"></div>
      `
    });

    let call = 0;
    const result = await lookupCrossoverCompatibility("Totally Different Game", async (url) => {
      call += 1;
      return call === 1 ? fetchImpl(url) : detailFetch(url);
    });

    expect(result.found).toBe(false);
    expect(result.reason).toBe("no_match");
  });
});
