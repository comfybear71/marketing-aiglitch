export interface MktPlatformAccount {
  id: string;
  platform: string;
  account_name: string | null;
  account_id: string | null;
  account_url: string | null;
  is_active: boolean;
}

export interface EnrichedPlatformBreakdown {
  platform: string;
  posted: number;
  queued: number;
  failed: number;
  impressions: number;
  likes: number;
  views: number;
  shares: number;
  comments: number;
  lastPostedAt: string | null;
  lastMetricsSync: string | null;
  followers: number | null;
  successRate: number;
  primaryLabel: string;
  primaryValue: number | null;
  secondaryMetrics: Array<{ label: string; value: number | null }>;
  postMetricsSupported: boolean;
}

export interface MarketingStats {
  totalPosted: number;
  totalQueued: number;
  totalFailed: number;
  totalImpressions: number;
  totalLikes: number;
  totalViews: number;
  successRate: number;
  platformBreakdown?: EnrichedPlatformBreakdown[];
}
