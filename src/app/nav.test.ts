import { describe, it, expect } from "vitest";
import { NAV, DEFAULT_SLUG, navItemForSlug } from "./nav";

describe("sidebar nav config", () => {
  it("has the 10 planned entries", () => {
    expect(NAV).toHaveLength(10);
  });

  it("lists the exact planned slugs in order", () => {
    expect(NAV.map((i) => i.slug)).toEqual([
      "ad-creator",
      "sponsors",
      "ai-costs",
      "events",
      "ad-campaigns",
      "x-growth",
      "spec-ads",
      "merch-studio",
      "emails",
      "contact",
    ]);
  });

  it("has unique slugs", () => {
    const slugs = NAV.map((i) => i.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives every entry a non-empty label and icon", () => {
    for (const item of NAV) {
      expect(item.label.trim().length).toBeGreaterThan(0);
      expect(item.icon.trim().length).toBeGreaterThan(0);
    }
  });

  it("defaults to Ad Creator, the headline feature", () => {
    expect(DEFAULT_SLUG).toBe("ad-creator");
  });

  it("resolves a known slug and returns undefined for an unknown one", () => {
    expect(navItemForSlug("ad-creator")?.label).toBe("Ad Creator");
    expect(navItemForSlug("nope")).toBeUndefined();
  });
});
