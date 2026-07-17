/**
 * Sidebar navigation config — single source of truth.
 *
 * Each entry drives BOTH a sidebar button and a route at `/<slug>`.
 * Every slug must have a matching `src/app/<slug>/page.tsx`. This
 * session every page is a "Coming next session" placeholder; tabs gain
 * real content one at a time in later sessions (Ad Creator first).
 *
 * Order matters — it's the visual order in the sidebar. Ad Creator is
 * first because it's the headline feature of this app.
 */

export interface NavItem {
  /** URL slug + route folder name. Unique. */
  slug: string;
  /** Sidebar label. */
  label: string;
  /** Emoji icon shown in the sidebar. */
  icon: string;
}

export const NAV: NavItem[] = [
  { slug: "ad-creator", label: "Ad Creator", icon: "\u{1F3AC}" },     // 🎬 — THE big new tab (session 2)
  { slug: "marketing", label: "Social Platforms", icon: "\u{1F4F1}" }, // 📱 — YouTube API compliance + platform connect
  { slug: "sponsors", label: "Sponsors", icon: "\u{1F91D}" },         // 🤝 — moves from admin (session 3)
  { slug: "ai-costs", label: "AI Costs", icon: "\u{1F4B0}" },         // 💰
  { slug: "events", label: "Events", icon: "\u{1F3AD}" },             // 🎭
  { slug: "ad-campaigns", label: "Ad Campaigns", icon: "\u{1F4E2}" }, // 📢
  { slug: "x-growth", label: "X Growth", icon: "\u{1F680}" },         // 🚀
  { slug: "spec-ads", label: "Spec Ads", icon: "\u{1F39E}️" },   // 🎞️
  { slug: "merch-studio", label: "Merch Studio", icon: "\u{1F455}" }, // 👕
  { slug: "emails", label: "Emails", icon: "\u{1F4E7}" },             // 📧
  { slug: "contact", label: "Contact", icon: "\u{1F4C7}" },           // 📇
];

/** The route we land on after login / from `/`. */
export const DEFAULT_SLUG = NAV[0].slug;

/** Look up a nav item by slug. */
export function navItemForSlug(slug: string): NavItem | undefined {
  return NAV.find((item) => item.slug === slug);
}
