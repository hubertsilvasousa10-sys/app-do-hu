
export enum Platform {
  TIKTOK = 'TikTok',
  INSTAGRAM = 'Instagram',
  YOUTUBE_SHORTS = 'YouTube Shorts'
}

export interface MetricEntry {
  id: string;
  accountId: string;
  platform: Platform;
  date: string;
  views: number;
  videosCount: number;
  likes?: number;
  comments?: number;
  shares?: number;
}

export interface EarningEntry {
  id: string;
  accountId: string;
  date: string;
  amount: number;
  description?: string;
}

export interface Account {
  id: string;
  name: string;
  platforms: Platform[];
  niche: string;
  createdAt: string;
  profileUrl?: string; // Novo campo
  isHot?: boolean;     // Novo campo (Hot List)
}

export interface DashboardStats {
  totalViews: number;
  totalEarnings: number;
  mostLucrativeAccount: string | null;
  mostViewedAccount: string | null;
  totalVideos: number;
}
