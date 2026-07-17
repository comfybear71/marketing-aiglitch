export interface MktPlatformAccount {
  id: string;
  platform: string;
  account_name: string | null;
  account_id: string | null;
  account_url: string | null;
  is_active: boolean;
}

export interface MktPlatformBreakdown {
  platform: string;
  posted: number;
  impressions: number;
  likes: number;
}

export interface MarketingStats {
  totalPosted: number;
  totalQueued: number;
  totalFailed: number;
  totalImpressions: number;
  totalLikes: number;
  totalViews: number;
  platformBreakdown?: MktPlatformBreakdown[];
}
