import { Link } from 'react-router-dom';
import { useMlDonorChurnScores } from '@/hooks/useMlDonorChurnScores';

type Props = {
  page: number;
  pageSize: number;
};

export default function MlDonorChurnPanel({ page, pageSize }: Props) {
  const { rows, loading, error } = useMlDonorChurnScores(page, pageSize);

  return (
    <section
      className="rounded-2xl border border-border bg-white shadow-sm p-6 mb-8"
      aria-label="Live ML donor churn scores"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">ML — IS 455</p>
          <h2 className="text-xl font-serif text-foreground">Live ML — donor churn (90d)</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Scores from deployed model via .NET → FastAPI. Same features as{' '}
            <code className="text-xs bg-background px-1 rounded">donor_churn_pipeline.ipynb</code>.
          </p>
        </div>
        <Link to="/admin/ml-integration">
          <span className="text-sm font-medium text-primary cursor-pointer hover:underline">
            View all ML integrations
          </span>
        </Link>
      </div>

      {loading && <p className="text-muted-foreground text-sm">Loading scores…</p>}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && rows && rows.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No scores (ML service off, empty page, or upstream error). Configure{' '}
          <code className="text-xs">Ml:BaseUrl</code> and run FastAPI + trained{' '}
          <code className="text-xs">donor_churn_rf.joblib</code>.
        </p>
      )}
      {!loading && rows && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase text-xs tracking-wide">
                <th className="py-2 pr-4">Supporter ID</th>
                <th className="py-2 pr-4">Churn probability</th>
                <th className="py-2 pr-4">Tier</th>
                <th className="py-2">Recommended action</th>
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
                      r.churnProbability.toFixed(3)
                    )}
                  </td>
                  <td className="py-2 pr-4 font-medium text-foreground">{r.tier}</td>
                  <td className="py-2 text-muted-foreground max-w-md">{r.recommendedAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
