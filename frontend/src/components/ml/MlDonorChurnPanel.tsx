import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMlDonorChurnScores } from '@/hooks/useMlDonorChurnScores';
import QuestionTooltip from '@/components/shared/QuestionTooltip';

type Props = {
  page: number;
  pageSize: number;
  totalCount?: number;
};

const PAGE_SIZE = 10;

export default function MlDonorChurnPanel({ page: _page, pageSize: _pageSize, totalCount }: Props) {
  const [page, setPage] = useState(1);
  const { rows, loading, error } = useMlDonorChurnScores(page, PAGE_SIZE);
  const sortedRows = useMemo(
    () =>
      [...(rows ?? [])].sort((a, b) => {
        if (a.error && !b.error) return 1;
        if (!a.error && b.error) return -1;
        return b.churnProbability - a.churnProbability;
      }),
    [rows],
  );
  const canGoNext = !loading && sortedRows.length === PAGE_SIZE;
  const totalPages = totalCount != null && totalCount > 0 ? Math.ceil(totalCount / PAGE_SIZE) : null;

  useEffect(() => {
    if (error) return;
    if (!loading && sortedRows.length === 0 && page > 1) {
      setPage((p) => Math.max(1, p - 1));
    }
  }, [error, loading, page, sortedRows.length]);

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
            Helps the team quickly see which donors are most likely to stop giving soon, so outreach
            can happen earlier and keep support steady.
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
                <th className="py-2 pr-4">
                  Churn probability
                  <QuestionTooltip
                    label="What churn probability means"
                    text="How likely this donor is to stop donating soon, shown from 0 to 1. A higher number means higher risk."
                  />
                </th>
                <th className="py-2 pr-4">
                  Tier
                  <QuestionTooltip
                    label="What tier means"
                    text="A simple risk level bucket based on churn probability, like low, medium, or high, so staff can prioritize quickly."
                  />
                </th>
                <th className="py-2">
                  Recommended action
                  <QuestionTooltip
                    label="What recommended action means"
                    text="The outreach step the model suggests next, such as a thank-you message, check-in call, or re-engagement campaign."
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((r) => (
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
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <p />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="px-2 py-1 rounded border border-border disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <span>
                Page {page}
                {totalPages ? ` / ${totalPages}` : ''}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={loading || (totalPages ? page >= totalPages : !canGoNext)}
                className="px-2 py-1 rounded border border-border disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Showing {sortedRows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-
            {(page - 1) * PAGE_SIZE + sortedRows.length}
            {totalCount != null ? ` of ${totalCount}` : ''}
          </p>
        </div>
      )}
    </section>
  );
}
