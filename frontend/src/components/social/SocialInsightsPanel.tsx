import { formatPhp, phpToUsdTooltip } from '@/lib/currencyPhp';
import { useSocialInsightsSummary } from '@/hooks/useSocialInsightsSummary';
import QuestionTooltip from '@/components/shared/QuestionTooltip';
import InlineHoverTooltip from '@/components/shared/InlineHoverTooltip';

function BarRow({
  label,
  value,
  max,
  rightText,
}: {
  label: string;
  value: number;
  max: number;
  rightText: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm text-foreground mb-1">
        <span>{label}</span>
        <span className="text-muted-foreground">
          <InlineHoverTooltip text={phpToUsdTooltip(value)}>{rightText}</InlineHoverTooltip>
        </span>
      </div>
      <div className="h-2 rounded bg-muted overflow-hidden">
        <div className="h-full rounded bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function SocialInsightsPanel() {
  const { data, loading, error } = useSocialInsightsSummary();

  const platformMax = Math.max(
    1,
    ...(data?.platformPerformance.map((x) => x.donationValuePerPostPhp) ?? [1]),
  );
  const contentMax = Math.max(
    1,
    ...(data?.contentPerformance.map((x) => x.donationValuePerPostPhp) ?? [1]),
  );
  const timeMax = Math.max(
    1,
    ...(data?.timeOfDayPerformance.map((x) => x.donationValuePerPostPhp) ?? [1]),
  );

  return (
    <section className="rounded-2xl border border-border bg-white shadow-sm p-6 mb-8">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">INSIGHTS - HISTORICAL</p>
        <h2 className="text-xl font-serif text-foreground">What social media strategy works</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Uses past post performance to guide what to post, where to post, when to post, and how often
          to post for stronger donation outcomes.
        </p>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading social insights...</p>}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && data && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-sm text-foreground">
              <span className="font-semibold">Recommended posting pace:</span>{' '}
              about <span className="font-semibold">{data.recommendedPostsPerWeek}</span> posts per week.
              <QuestionTooltip
                label="How posting pace is calculated"
                text="This is based on the weeks in your past data that gave the strongest donation value per post."
              />
            </p>
            <p className="text-xs text-muted-foreground mt-1">{data.recommendationNote}</p>
            <p className="text-xs text-muted-foreground mt-1">Sample size: {data.sampleSize} posts.</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Best platforms (by donation value per post)
              <QuestionTooltip
                label="How to read best platforms"
                text="Higher bars mean that platform usually brings more donation value per post, not just more likes."
              />
            </h3>
            {(data.platformPerformance ?? []).slice(0, 4).map((row) => (
              <BarRow
                key={row.platform}
                label={`${row.platform} (${row.posts} posts)`}
                value={row.donationValuePerPostPhp}
                max={platformMax}
                rightText={`${formatPhp(row.donationValuePerPostPhp)} / post`}
              />
            ))}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">
              What to post (donation impact vs likes)
              <QuestionTooltip
                label="How to read content findings"
                text="Use this to pick content types that lead to donations, not only content that gets attention."
              />
            </h3>
            {(data.contentPerformance ?? []).slice(0, 5).map((row) => (
              <BarRow
                key={row.contentTopic}
                label={`${row.contentTopic} (${Math.round(row.avgLikes)} avg likes)`}
                value={row.donationValuePerPostPhp}
                max={contentMax}
                rightText={`${formatPhp(row.donationValuePerPostPhp)} / post`}
              />
            ))}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Best time of day to post
              <QuestionTooltip
                label="How to read time of day"
                text="Higher bars mean those posting times have produced stronger donation value per post in past data."
              />
            </h3>
            {(data.timeOfDayPerformance ?? []).map((row) => (
              <BarRow
                key={row.timeBucket}
                label={row.timeBucket}
                value={row.donationValuePerPostPhp}
                max={timeMax}
                rightText={`${formatPhp(row.donationValuePerPostPhp)} / post`}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
