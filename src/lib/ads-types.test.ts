import { describe, it, expect } from "vitest";
import {
  AD_BRIEF_STATUS_VALUES,
  formatBytes,
  formatTargetSocials,
  isGenerating,
  parseGenerationLog,
  parseTargetSocials,
  statusMeta,
  totalEstimatedUsd,
  type GenerationLogEntry,
} from "./ads-types";

describe("statusMeta", () => {
  it("returns a label + classes for every backend status", () => {
    for (const s of AD_BRIEF_STATUS_VALUES) {
      const m = statusMeta(s);
      expect(m.label.length).toBeGreaterThan(0);
      expect(m.classes).toContain("border");
    }
  });

  it("falls back to draft for an unknown status", () => {
    // @ts-expect-error — intentionally invalid to test the guard
    expect(statusMeta("bogus").label).toBe(statusMeta("draft").label);
  });
});

describe("parseTargetSocials / formatTargetSocials", () => {
  it("trims, lowercases, and de-dupes", () => {
    expect(parseTargetSocials(" Feed, telegram ,FEED,x ")).toEqual(["feed", "telegram", "x"]);
  });

  it("treats null/empty as no socials", () => {
    expect(parseTargetSocials(null)).toEqual([]);
    expect(parseTargetSocials("")).toEqual([]);
    expect(parseTargetSocials("  , ,")).toEqual([]);
  });

  it("round-trips to canonical CSV or null", () => {
    expect(formatTargetSocials(["Feed", "X", "feed"])).toBe("feed,x");
    expect(formatTargetSocials([])).toBeNull();
    expect(formatTargetSocials(["  "])).toBeNull();
  });
});

describe("parseGenerationLog", () => {
  it("parses a valid JSON array", () => {
    const entries: GenerationLogEntry[] = [{ step: "claude_script", status: "ok" }];
    expect(parseGenerationLog(JSON.stringify(entries))).toEqual(entries);
  });

  it("never throws on bad/empty input", () => {
    expect(parseGenerationLog(null)).toEqual([]);
    expect(parseGenerationLog("not json")).toEqual([]);
    expect(parseGenerationLog('{"not":"array"}')).toEqual([]);
  });
});

describe("totalEstimatedUsd", () => {
  it("sums estimated_usd, ignoring steps without a cost", () => {
    const log: GenerationLogEntry[] = [
      { step: "cost_estimate", status: "ok", estimated_usd: 0.1 },
      { step: "heygen_anchor", status: "ok", estimated_usd: 1.2 },
      { step: "stitch", status: "ok" },
    ];
    expect(totalEstimatedUsd(log)).toBeCloseTo(1.3, 5);
  });
});

describe("formatBytes", () => {
  it("renders human-readable sizes", () => {
    expect(formatBytes(null)).toBe("—");
    expect(formatBytes(0)).toBe("—");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});

describe("isGenerating", () => {
  it("is true only for the generating status", () => {
    expect(isGenerating("generating")).toBe(true);
    expect(isGenerating("draft")).toBe(false);
    expect(isGenerating("posted")).toBe(false);
  });
});
