import { Link } from 'react-router-dom';
import { useMlDeploymentStatus } from '@/hooks/useMlDeploymentStatus';

export default function MlSocialPipelinePanel() {
  const { data, loading } = useMlDeploymentStatus();
  const row = data?.pipelines.find((p) => p.id === 'social_engagement');

  return (
    <section
      className="rounded-2xl border border-border bg-white shadow-sm p-6 mb-8"
      aria-label="Social media ML pipeline"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">ML — IS 455</p>
          <h2 className="text-xl font-serif text-foreground">Social engagement → donations</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Forecasts and charts from <code className="text-xs">social_media_engagement_to_donations.ipynb</code>{' '}
            will appear here after the model is trained and deployed.
          </p>
        </div>
        <Link to="/admin/ml-integration">
          <span className="text-sm font-medium text-primary cursor-pointer hover:underline">
            ML integration overview
          </span>
        </Link>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading status…</p>}
      {!loading && row && (
        <div className="rounded-xl bg-background border border-border p-4 text-sm">
          <p>
            <span className="text-muted-foreground">Model loaded:</span>{' '}
            <span className={row.mlModelLoaded ? 'text-green-700 font-medium' : 'text-amber-700 font-medium'}>
              {row.mlModelLoaded ? 'Yes' : 'Not yet — add social_engagement_rf.joblib'}
            </span>
          </p>
        </div>
      )}
    </section>
  );
}
