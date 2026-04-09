import { Link } from 'react-router-dom';
import { useMlDeploymentStatus } from '@/hooks/useMlDeploymentStatus';

const CASELOAD_IDS = new Set([
  'resident_wellbeing',
  'early_warning',
  'reintegration',
]);

export default function MlCaseloadPipelinePanel() {
  const { data, loading } = useMlDeploymentStatus();
  const rows = data?.pipelines.filter((p) => CASELOAD_IDS.has(p.id)) ?? [];

  return (
    <section
      className="rounded-2xl border border-border bg-white shadow-sm p-6 mb-8"
      aria-label="Resident ML pipelines deployment status"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">ML — IS 455</p>
          <h2 className="text-xl font-serif text-foreground">Caseload ML pipelines (status)</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Wellbeing, early warning, and reintegration models will surface here when artifacts and
            routes are wired. Below shows whether each model file is loaded in the ML API.
          </p>
        </div>
        <Link to="/admin/ml-integration">
          <span className="text-sm font-medium text-primary cursor-pointer hover:underline">
            ML integration overview
          </span>
        </Link>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading status…</p>}
      {!loading && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase text-xs tracking-wide">
                <th className="py-2 pr-4">Pipeline</th>
                <th className="py-2 pr-4">Notebook</th>
                <th className="py-2 pr-4">ML API</th>
                <th className="py-2 pr-4">Model loaded</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/60">
                  <td className="py-2 pr-4 font-medium">{r.id.replace(/_/g, ' ')}</td>
                  <td className="py-2 pr-4 text-muted-foreground font-mono text-xs">{r.notebook}</td>
                  <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">{r.mlApiRoute}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={
                        r.mlModelLoaded ? 'text-green-700 font-medium' : 'text-amber-700 font-medium'
                      }
                    >
                      {r.mlModelLoaded ? 'Yes' : 'Not yet'}
                    </span>
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
