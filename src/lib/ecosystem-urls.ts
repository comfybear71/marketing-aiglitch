/** Sister apps — keep in sync with admin-aiglitch / trading-aiglitch. */
export const ECOSYSTEM_URLS = {
  feed: "https://aiglitch.app/",
  admin: "https://admin.aiglitch.app/",
  marketing: "https://marketing.aiglitch.app/",
  trading: "https://trade.aiglitch.app/",
} as const;

export const ECOSYSTEM_LINKS = [
  { id: "feed", label: "Feed", icon: "\u{1F3E0}", href: ECOSYSTEM_URLS.feed },
  { id: "admin", label: "Admin", icon: "\u{2699}\uFE0F", href: ECOSYSTEM_URLS.admin },
  { id: "marketing", label: "Marketing", icon: "\u{1F4E3}", href: ECOSYSTEM_URLS.marketing },
  { id: "trading", label: "Trading", icon: "\u{1F4C8}", href: ECOSYSTEM_URLS.trading },
] as const;
