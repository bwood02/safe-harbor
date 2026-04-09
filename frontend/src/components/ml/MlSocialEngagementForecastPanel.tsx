import { Link } from 'react-router-dom';
import { useMlSocialEngagementForecast } from '@/hooks/useMlSocialEngagementForecast';
import { formatPhp, phpToUsdTooltip } from '@/lib/currencyPhp';
import InlineHoverTooltip from '@/components/shared/InlineHoverTooltip';
import QuestionTooltip from '@/components/shared/QuestionTooltip';

export default function MlSocialEngagementForecastPanel() {
  const { rows, loading, error } = useMlSocialEngagementForecast();

  return (
    <section
      className="rounded-2xl border border-border bg-white shadow-sm p-6 mb-8"
      aria-label="Live ML social engagement forecast"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">ML - IS 455</p>
          <h2 className="text-xl font-serif text-foreground">Live ML - social engagement forecast</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gives a next-month donation estimate from social media performance so staff can plan better
            campaigns without needing a marketing team.
          </p>
        </div>
        <Link to="/admin/ml-integration">
          <span className="text-sm font-medium text-primary cursor-pointer hover:underline">
            ML integration overview
          </span>
        </Link>
      </div>

      {loading && <p className="text-muted-foreground text-sm">Loading forecast...</p>}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && rows && rows.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No forecast rows returned for the current feature month.
        </p>
      )}
      {!loading && rows && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase text-xs tracking-wide">
                <th className="py-2 pr-4">Month</th>
                <th className="py-2 pr-4">
                  Predicted next monetary
                  <QuestionTooltip
                    label="What predicted next monetary means"
                    text="This is the model's estimate of donation value for the next month based on recent social media results."
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.month} className="border-b border-border/60">
                  <td className="py-2 pr-4 font-mono">{r.month}</td>
                  <td className="py-2 pr-4">
                    {r.error ? (
                      <span className="text-destructive text-xs">{r.error}</span>
                    ) : (
                      <InlineHoverTooltip text={phpToUsdTooltip(r.predictedNextMonetary)}>
                        {formatPhp(r.predictedNextMonetary)}
                      </InlineHoverTooltip>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
