import { Link } from 'react-router-dom';
import { useMlDonorHighValueScores } from '@/hooks/useMlDonorHighValueScores';

type Props = {
  page: number;
  pageSize: number;
};

export default function MlDonorHighValuePanel({ page, pageSize }: Props) {
  const { rows, loading, error } = useMlDonorHighValueScores(page, pageSize);

  return (
    <section
      className="rounded-2xl border border-border bg-white shadow-sm p-6 mb-8"
      aria-label="Live ML donor high-value scores"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">ML - IS 455</p>
          <h2 className="text-xl font-serif text-foreground">Live ML - donor high-value propensity</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Likelihood a supporter is in the high-value segment using{' '}
            <code className="text-xs bg-background px-1 rounded">high_value_donor_profiles.ipynb</code>.
          </p>
        </div>
        <Link to="/admin/ml-integration">
          <span className="text-sm font-medium text-primary cursor-pointer hover:underline">
            View all ML integrations
          </span>
        </Link>
      </div>

      {loading && <p className="text-muted-foreground text-sm">Loading scores...</p>}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && rows && rows.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No scores available yet. Verify ML service connectivity and the trained{' '}
          <code className="text-xs">donor_high_value_rf.joblib</code> artifact.
        </p>
      )}
      {!loading && rows && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase text-xs tracking-wide">
                <th className="py-2 pr-4">Supporter ID</th>
                <th className="py-2 pr-4">High-value probability</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.supporterId} className="border-b border-border/60">
                  <td className="py-2 pr-4 font-mono">{r.supporterId}</td>
                  <td className="py-2 pr-4">
                    {r.error ? (
                      <span className="text-destructive text-xs">{r.error}</span>
                    ) : (
                      r.highValueProbability.toFixed(3)
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
