import AppHeader from '@/components/shared/AppHeader';
import PublicFooter from '@/components/shared/PublicFooter';
import MlSocialPipelinePanel from '@/components/ml/MlSocialPipelinePanel';
import MlSocialEngagementForecastPanel from '@/components/ml/MlSocialEngagementForecastPanel';
import SocialInsightsPanel from '@/components/social/SocialInsightsPanel';

export default function SocialMediaDashboardPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
            Internal Use Only
          </p>
          <h1 className="text-4xl lg:text-5xl font-serif text-foreground mb-6">
            Social Media Dashboard
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
            See what social media actions are helping donations, so your team can post smarter with less guesswork.
          </p>
        </div>

        <SocialInsightsPanel />
        <MlSocialPipelinePanel />
        <MlSocialEngagementForecastPanel />
      </main>
      <PublicFooter />
    </div>
  );
}
