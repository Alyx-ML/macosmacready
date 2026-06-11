import { describe, expect, it } from "vitest";

const SALES_DEAL_TERMS = /\b(sale|on sale|discount|discounted|coupon|save \$|save up to|% off|today only|lowest price|record-low|record low|all-time low|price drop|price cut|clearance|promo|promotion|bundle|lifetime license|sponsored|advertorial|stacksocial|walmart|best buy|amazon|b&h|marked down)\b/i;
const IDIOMATIC_DEAL_TERMS = /\b(?:biggest|main|real|whole|entire|true)\s+deal\s+(?:about|with|here|is|was|isn't|is not|breaker)|(?:the|this|that|a)\s+deal\s+(?:about|with|here|is|was|isn't|is not|breaker)|not\s+(?:the|a)\s+deal\b|\bdeal\s+breaker\b/i;
const COMMERCIAL_PRICE_TERMS = /(?:[$£€]\s?\d[\d,]*(?:\.\d{2})?|\d{1,3}%\s?off|save\s?(?:up to\s?)?[$£€]?\s?\d[\d,]*|[$£€]?\s?\d[\d,]*\s?off|all-time low|record low|lowest price)/i;
const MAC_DEAL_TERMS = /\b(MacBook|iMac|Mac mini|Mac Studio|Mac Pro|Studio Display|Apple display|Apple silicon)\b/i;
const MACBOOK_DEAL_TERMS = /\b(MacBook|MacBook Air|MacBook Pro|USB-C|Thunderbolt|MagSafe|dock|hub|charger|adapter|monitor|display|SSD|external drive|keyboard|mouse|trackpad|sleeve|case|stand|backpack|accessor(?:y|ies)|AppleCare|M[1-9]\b)\b/i;

function hasCommercialDealSignal(title, headlineText) {
  if (SALES_DEAL_TERMS.test(headlineText) || COMMERCIAL_PRICE_TERMS.test(headlineText)) return true;
  if (/\b(deals?)\b/i.test(title) && !IDIOMATIC_DEAL_TERMS.test(headlineText)) return true;
  return false;
}

function isMacDealArticle(article) {
  const title = article.title || "";
  const headlineText = `${title} ${article.subtitle || ""}`;
  if (!hasCommercialDealSignal(title, headlineText)) return false;
  return MACBOOK_DEAL_TERMS.test(headlineText) || MAC_DEAL_TERMS.test(headlineText);
}

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
