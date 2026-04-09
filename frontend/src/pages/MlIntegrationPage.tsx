import { Link } from 'react-router-dom';
import PublicFooter from '@/components/shared/PublicFooter';
import { useMlDeploymentStatus } from '@/hooks/useMlDeploymentStatus';

export default function MlIntegrationPage() {
  const { data, loading, error } = useMlDeploymentStatus();

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
          Internal — IS 455
        </p>
        <h1 className="text-4xl font-serif text-foreground mb-4">ML integration overview</h1>
        <p className="text-muted-foreground mb-8 max-w-3xl">
          Each row maps a notebook pipeline to a page in the app. The Backend column is the ASP.NET route when a proxy
          exists; the ML API column is the FastAPI path relative to <code className="text-xs">Ml:BaseUrl</code>. Model
          status comes from <code className="text-xs">GET …/models</code> (see{' '}
          <code className="text-xs">docs/ml-deployment.md</code>).
        </p>

        {loading && <p className="text-muted-foreground">Loading…</p>}
        {!loading && error && (
          <div
            className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 mb-6 text-sm space-y-2"
            role="alert"
          >
            <p className="font-medium text-destructive">Could not load deployment status</p>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-muted-foreground">
              Run <code className="text-xs">dotnet run</code> in <code className="text-xs">backend/backend</code> (port
              5176), restart <code className="text-xs">npm run dev</code>, then refresh. Remove or fix{' '}
              <code className="text-xs">VITE_API_BASE_URL</code> in <code className="text-xs">frontend/.env</code> (or{' '}
              <code className="text-xs">.env.local</code>){' '}
              if present; leaving it unset uses the Vite proxy. Use <code className="text-xs">http://localhost:5173</code>{' '}
              or <code className="text-xs">http://127.0.0.1:5173</code> consistently with your API URL.
            </p>
          </div>
        )}
        {!loading && data && (
          <>
            <div className="rounded-xl border border-border bg-white p-4 mb-6 text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">ML service configured:</span>{' '}
                {data.mlServiceConfigured ? 'Yes' : 'No (set Ml:BaseUrl in backend)'}
              </p>
              {data.mlServiceConfigured && (
                <p>
                  <span className="text-muted-foreground">ML reachable:</span>{' '}
                  {data.mlReachable === true ? (
                    <span className="text-green-700 font-medium">Yes</span>
                  ) : data.mlReachable === false ? (
                    <span className="text-destructive font-medium">No</span>
                  ) : (
                    '—'
                  )}
                </p>
              )}
              {data.message && <p className="text-amber-800">{data.message}</p>}
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-background/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">Pipeline</th>
                    <th className="px-4 py-3">Notebook</th>
                    <th className="px-4 py-3">UI page</th>
                    <th className="px-4 py-3">Backend (.NET)</th>
                    <th className="px-4 py-3">ML API (FastAPI)</th>
                    <th className="px-4 py-3">Model</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pipelines.map((p) => (
                    <tr key={p.id} className="border-b border-border/60">
                      <td className="px-4 py-3 font-medium">{p.id.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.notebook}</td>
                      <td className="px-4 py-3">
                        <Link to={p.uiPath}>
                          <span className="text-primary cursor-pointer hover:underline">{p.uiPath}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.dotnetRoute}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.mlApiRoute}</td>
                      <td className="px-4 py-3">
                        {p.mlModelLoaded ? (
                          <span className="text-green-700 font-medium">Loaded</span>
                        ) : (
                          <span className="text-amber-700 font-medium">Not loaded</span>
                        )}
                        {p.error && (
                          <div className="text-xs text-destructive mt-1 max-w-xs">{p.error}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
