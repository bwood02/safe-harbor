import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useResidentWellbeingScores } from '@/hooks/useResidentWellbeingScores';
import QuestionTooltip from '@/components/shared/QuestionTooltip';

const PAGE_SIZE = 10;

export default function MlResidentWellbeingPanel() {
  const { rows, loading, error } = useResidentWellbeingScores();
  const [page, setPage] = useState(1);
  const sortedRows = useMemo(
    () =>
      [...(rows ?? [])].sort((a, b) => {
        if (a.error && !b.error) return 1;
        if (!a.error && b.error) return -1;
        return a.predictedWellbeingNext - b.predictedWellbeingNext;
      }),
    [rows],
  );
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [rows]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const visibleRows = useMemo(
    () => sortedRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [page, sortedRows],
  );

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
            Helps staff spot residents who may need extra support next month, so help can be planned
            earlier and outcomes improve. Wellbeing is scored on a 1-5 scale.
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
                <th className="py-2 pr-4">
                  This month (lag)
                  <QuestionTooltip
                    label="What this month lag means"
                    text="This is the resident's latest wellbeing score from this month on a 1-5 scale. It is a combined score made from 4 parts: sleep, nutrition, energy, and general health. We use this as the starting point before predicting next month."
                  />
                </th>
                <th className="py-2 pr-4">
                  Predicted next month
                  <QuestionTooltip
                    label="What predicted next month means"
                    text="This is the model's best guess of the resident's wellbeing score next month on a 1-5 scale. It predicts the same combined score (sleep + nutrition + energy + general health) using this month's data."
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((r) => (
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
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <p>
              Showing {sortedRows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-
              {Math.min(page * PAGE_SIZE, sortedRows.length)} of {sortedRows.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-2 py-1 rounded border border-border disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <span>
                Page {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-2 py-1 rounded border border-border disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
