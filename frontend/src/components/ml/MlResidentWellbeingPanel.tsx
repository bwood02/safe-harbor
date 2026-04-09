import { Link } from 'react-router-dom';
import { useResidentWellbeingScores } from '@/hooks/useResidentWellbeingScores';

export default function MlResidentWellbeingPanel() {
  const { rows, loading, error } = useResidentWellbeingScores();

  return (
    <section
      className="rounded-2xl border border-border bg-white shadow-sm p-6 mb-8"
      aria-label="Live ML resident wellbeing scores"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">ML — IS 455</p>
          <h2 className="text-xl font-serif text-foreground">Live ML — next-month wellbeing</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Predicted composite wellbeing in month m+1 from features in month m. Data: SQL → .NET →
            FastAPI (<code className="text-xs bg-background px-1 rounded">resident_wellbeing_next_month.ipynb</code>
            ).
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
          No scores for the default month (no panel rows, ML off, or model missing). Train{' '}
          <code className="text-xs">resident_wellbeing_rf.joblib</code>, set <code className="text-xs">Ml:BaseUrl</code>
          , and ensure health data exists for consecutive months.
        </p>
      )}
      {!loading && rows && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase text-xs tracking-wide">
                <th className="py-2 pr-4">Resident ID</th>
                <th className="py-2 pr-4">This month (lag)</th>
                <th className="py-2 pr-4">Predicted next month</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.residentId} className="border-b border-border/60">
                  <td className="py-2 pr-4 font-mono">{r.residentId}</td>
                  <td className="py-2 pr-4">
                    {r.error ? (
                      <span className="text-destructive text-xs">{r.error}</span>
                    ) : (
                      r.wellbeingLag.toFixed(3)
                    )}
                  </td>
                  <td className="py-2 pr-4 font-medium text-foreground">
                    {r.error ? '—' : r.predictedWellbeingNext.toFixed(3)}
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
