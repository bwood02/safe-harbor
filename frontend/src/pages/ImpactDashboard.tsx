import AppHeader from '@/components/shared/AppHeader';
import PublicFooter from '@/components/shared/PublicFooter';
import { featuredStory, restorationStories } from '@/data/featuredStory';
import {
  useImpactSummary,
  useOutcomeDistribution,
  useMonthlyDonationTrend,
} from '@/hooks/useImpact';

export default function ImpactDashboardPage() {
  const summary = useImpactSummary();
  const outcomesQuery = useOutcomeDistribution();
  const trendQuery = useMonthlyDonationTrend();
  const trend = trendQuery.data ?? [];
  const trendMax = Math.max(1, ...trend.map((t) => t.total));

  const statCards = [
    {
      label: 'Girls Supported',
      value: summary.loading
        ? '…'
        : summary.data
          ? summary.data.girlsSupported.toLocaleString()
          : '—',
    },
    {
      label: 'Active Safehouses',
      value: summary.loading
        ? '…'
        : summary.data
          ? summary.data.safehouses.toLocaleString()
          : '—',
    },
    {
      label: 'Donors & Supporters',
      value: summary.loading
        ? '…'
        : summary.data
          ? summary.data.donors.toLocaleString()
          : '—',
    },
  ];

  const outcomes = outcomesQuery.data ?? [];

  return (
    <div className="min-h-screen bg-background">
      

      {/* Hero Section */}
      <section
        className="relative min-h-[calc(100svh-72px)] flex items-center overflow-hidden py-6 md:py-8"
        aria-labelledby="hero-headline"
      >
        <div className="absolute inset-0 sh-warm-hero-bg -z-10" />
        
        <div className="max-w-6xl mx-auto px-6 relative z-10 w-full">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <div className="w-full md:flex-1 md:pr-6">
              <span className="inline-block py-1 px-3 rounded-full bg-secondary/30 text-foreground text-xs sm:text-sm font-semibold tracking-wider uppercase mb-4 md:mb-5 border border-secondary/50">
                {featuredStory.eyebrow}
              </span>
              <h2
                id="hero-headline"
                className="font-serif font-medium text-foreground leading-[1.05] mb-4 md:mb-5 text-[clamp(2rem,5vw,4.5rem)]"
              >
                {featuredStory.headline}
              </h2>
              <p className="text-[clamp(1rem,1.6vw,1.25rem)] text-muted-foreground leading-relaxed mb-6 md:mb-8">
                {featuredStory.dek}
              </p>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <button
                  className="px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-full bg-primary text-white text-base sm:text-lg font-medium hover:bg-primary/90 transition-colors shadow-sm"
                  aria-label="Donate now to support Safe Harbor"
                >
                  Support Our Work
                </button>
                <button
                  className="px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-full border border-foreground/20 text-foreground text-base sm:text-lg font-medium hover:bg-foreground/5 transition-colors"
                  aria-label="Learn more about this story"
                >
                  Read the story
                </button>
              </div>
            </div>

            <div className="w-full md:w-[42%] lg:w-[44%] md:ml-auto relative flex justify-center md:justify-end lg:pl-6">
              <div className="relative w-full rounded-[2rem] overflow-hidden shadow-2xl aspect-[16/10] md:aspect-[4/4] lg:aspect-[4/3] max-h-[52svh] md:max-h-[58svh] sh-warm-hero-art-base">
                <img
                  src="/images/impact-hero-image.jpg"
                  alt="Safe Harbor impact story"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 sh-warm-hero-art-overlay opacity-55 mix-blend-multiply" />
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-foreground/60 to-transparent">
                  <p className="text-white text-base sm:text-lg font-serif italic text-shadow-sm">
                    "{featuredStory.imageCaption}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="min-h-[calc(100svh-72px)] flex items-center py-6 md:py-8 bg-white border-y border-border/50" aria-labelledby="impact-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full">
          <div className="text-center max-w-3xl mx-auto mb-6 md:mb-8">
            <h1
              id="impact-heading"
              className="font-serif text-foreground mb-4 text-[clamp(2rem,4vw,3.2rem)]"
            >
              The Reach of Our Care
            </h1>
            <p className="text-[clamp(1rem,1.4vw,1.25rem)] text-muted-foreground leading-relaxed">
              Numbers only tell part of the story. Each statistic represents a life touched, a dignity restored, and a future reclaimed.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 md:gap-5">
            {statCards.map(({ label, value }) => (
              <div
                key={label}
                className="rounded-3xl border border-border/60 bg-background/50 p-5 md:p-6 text-center hover:shadow-md transition-shadow"
                role="region"
                aria-label={`${label}: ${value}`}
              >
                <p className="font-serif text-primary mb-3 text-[clamp(2.2rem,5vw,3.6rem)]">{value}</p>
                <p className="text-sm md:text-base font-bold uppercase tracking-wider text-foreground/70">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Monthly Donation Trend */}
      <section
        className="py-10 md:py-14 bg-background border-b border-border/50"
        aria-labelledby="trend-heading"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full">
          <div className="text-center max-w-3xl mx-auto mb-6 md:mb-8">
            <h2
              id="trend-heading"
              className="font-serif text-foreground mb-3 text-[clamp(1.75rem,3.4vw,2.5rem)]"
            >
              Monthly Giving, Last 12 Months
            </h2>
            <p className="text-[clamp(0.95rem,1.3vw,1.1rem)] text-muted-foreground">
              Each bar represents one month of generosity from our donor community.
            </p>
          </div>

          {trend.length === 0 ? (
            <p className="text-center text-muted-foreground">No donation data available.</p>
          ) : (
            <div
              className="flex items-end gap-2 md:gap-3 h-48 md:h-60 px-2"
              role="img"
              aria-label="Monthly donation totals bar chart"
            >
              {trend.map(({ month, total }) => {
                const h = Math.max(4, Math.round((total / trendMax) * 100));
                return (
                  <div
                    key={month}
                    className="flex-1 h-full flex flex-col items-center justify-end gap-2"
                  >
                    <div
                      className="w-full rounded-t-md bg-primary/80 hover:bg-primary transition-colors"
                      style={{ height: `${h}%` }}
                      aria-label={`${month}: $${total.toLocaleString()}`}
                    />
                    <span className="text-[10px] md:text-xs text-muted-foreground font-mono">
                      {month.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Case Outcomes + Quote */}
      <section className="min-h-[calc(100svh-72px)] flex items-center py-6 md:py-8 bg-background" aria-labelledby="outcomes-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-center">
            {/* Outcomes */}
            <div>
              <h2
                id="outcomes-heading"
                className="font-serif text-foreground mb-6 text-[clamp(1.75rem,3.4vw,2.5rem)]"
              >
                Journeys of Restoration
              </h2>
              <div className="space-y-4 md:space-y-5">
                {outcomes.map(({ label, pct }) => (
                  <div key={label}>
                    <div className="flex justify-between items-end mb-2.5">
                      <span className="text-base md:text-lg text-foreground font-medium">{label}</span>
                      <span className="text-xl md:text-2xl font-serif text-primary">{pct}%</span>
                    </div>
                    <div
                      className="h-2.5 rounded-full bg-border overflow-hidden"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${label}: ${pct}%`}
                    >
                      <div
                        className="h-full rounded-full bg-primary/80 transition-all duration-1000 ease-out"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pull quote */}
            <div className="relative">
              <div className="absolute -inset-4 bg-secondary/20 rounded-[3rem] transform -rotate-3" />
              <div className="relative rounded-[2.5rem] p-5 sm:p-7 md:p-8 bg-foreground text-white shadow-xl">
                <span className="absolute top-4 left-6 md:top-6 md:left-8 text-6xl md:text-8xl text-white/10 font-serif leading-none select-none" aria-hidden="true">
                  "
                </span>
                <blockquote className="relative z-10">
                  <p className="font-serif italic leading-relaxed text-white/95 mb-6 text-[clamp(1.25rem,2.4vw,2rem)]">
                    Data allows us to see the scale, but empathy allows us to see the child. Our true success is measured in the silence of a peaceful night's sleep.
                  </p>
                  <footer>
                    <cite className="text-base md:text-lg text-primary not-italic font-medium block">
                      Sarah Al-Mansour
                    </cite>
                    <span className="text-white/60 text-sm md:text-base">Clinical Director</span>
                  </footer>
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Restoration Stories */}
      <section className="min-h-[calc(100svh-72px)] flex items-center py-6 md:py-8 bg-white" aria-labelledby="stories-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full">
          <div className="text-center mb-5 md:mb-6">
            <h2
              id="stories-heading"
              className="font-serif text-foreground mb-3 text-[clamp(2rem,4vw,3rem)]"
            >
              Voices of Hope
            </h2>
            <p className="text-[clamp(1rem,1.4vw,1.15rem)] text-muted-foreground">
              Placeholder survivor stories - swipe or scroll to browse, then open each full article.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 mb-3 md:mb-4 text-xs text-muted-foreground">
            <span className="rounded-full border border-border px-3 py-1 bg-background">Scroll</span>
            <span className="rounded-full border border-border px-3 py-1 bg-background">Stories</span>
          </div>

          <div
            className="flex gap-4 md:gap-5 overflow-x-auto snap-x snap-mandatory pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Survivor stories carousel"
          >
            {restorationStories.map((story, i) => {
              const warmGradients = [
                'sh-story-gradient-1',
                'sh-story-gradient-2',
                'sh-story-gradient-3',
              ];
              const storyImageById: Record<string, string> = {
                S001: '/images/impact-hero-image.jpg',
                S002: '/images/reconnecting-with-family.jpg',
                S003: '/images/educational-excellence.jpg',
              };
              const storyImage = storyImageById[story.id];

              return (
                <article
                  key={story.id}
                  className="group min-w-[80%] sm:min-w-[48%] lg:min-w-[32%] snap-start rounded-3xl bg-background border border-border/40 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                  aria-label={`Story card: ${story.title}`}
                >
                  <div className={`w-full aspect-[16/9] ${!storyImage ? warmGradients[i % 3] : ''} relative`} aria-hidden="true">
                    {storyImage ? (
                      <img
                        src={storyImage}
                        alt={story.title}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/5 transition-opacity duration-300" />
                  </div>
                  <div className="p-4 md:p-5">
                    <h3 className="text-lg md:text-xl font-serif text-foreground mb-2">
                      {story.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {story.description}
                    </p>
                    <a
                      href="#"
                      className="inline-flex items-center px-4 py-2 rounded-full border border-primary text-primary text-sm font-medium hover:bg-primary hover:text-white transition-colors"
                      aria-label={`Read full article for ${story.title}`}
                    >
                      Read Full Article
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
