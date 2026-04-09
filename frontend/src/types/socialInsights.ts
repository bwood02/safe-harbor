export interface PlatformInsightRow {
  platform: string;
  posts: number;
  avgEngagementRate: number;
  donationReferrals: number;
  estimatedDonationValuePhp: number;
  donationValuePerPostPhp: number;
}

export interface ContentInsightRow {
  contentTopic: string;
  posts: number;
  avgLikes: number;
  donationReferrals: number;
  estimatedDonationValuePhp: number;
  donationValuePerPostPhp: number;
}

export interface TimeOfDayInsightRow {
  timeBucket: string;
  posts: number;
  avgEngagementRate: number;
  donationReferrals: number;
  estimatedDonationValuePhp: number;
  donationValuePerPostPhp: number;
}

export interface SocialInsightsSummary {
  sampleSize: number;
  platformPerformance: PlatformInsightRow[];
  contentPerformance: ContentInsightRow[];
  timeOfDayPerformance: TimeOfDayInsightRow[];
  recommendedPostsPerWeek: number;
  recommendationNote: string;
}
