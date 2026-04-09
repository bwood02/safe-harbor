import { useEffect, useState } from 'react';
import StaffHeader from '@/components/shared/StaffHeader';
import PublicFooter from '@/components/shared/PublicFooter';
import {
  useAdminKpis,
  useAdminSafehouses,
  useWeeklyActivity,
  useRecentActivity,
  useUpcomingReviews,
  type RecentActivityItem,
} from '@/hooks/useAdminDashboard';
import { apiGet } from '@/lib/api';
import { formatPhp } from '@/lib/currencyPhp';

function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHrs = Math.round(diffMs / (1000 * 60 * 60));
  if (diffHrs < 1) return 'just now';
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.round(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

function formatWeekRange(startIso: string): string {
  const start = new Date(`${startIso}T00:00:00`);
  if (Number.isNaN(start.getTime())) return startIso;
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const startLabel = `${start.getMonth() + 1}/${start.getDate()}`;
  const endLabel = `${end.getMonth() + 1}/${end.getDate()}`;
  return `${startLabel}-${endLabel}`;
}

function formatHealthScore(value: number): string {
  return value.toFixed(2);
}

function ActivityFeedList({ items }: { items: RecentActivityItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity.</p>;
  }
  return (
    <ul className="space-y-5">
      {items.map((item, i) => (
        <li key={`${item.title}-${item.timestamp}-${i}`} className="flex gap-4 items-start group">
          <div
            className="mt-1.5 h-2 w-2 rounded-full bg-primary/60 group-hover:bg-primary transition-colors flex-shrink-0"
            aria-hidden="true"
          />
          <div>
            <p className="text-base font-medium text-foreground leading-snug mb-1">{item.title}</p>
            <p className="text-sm text-muted-foreground">
              {item.meta} <span className="mx-1 opacity-50">•</span> {formatRelativeDate(item.timestamp)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function AdminDashboardPage() {
  type WeeklyMetric = 'processRecordings' | 'homeVisitations' | 'donations';
  const kpis = useAdminKpis();
  const safehousesQuery = useAdminSafehouses();
  const weeklyQuery = useWeeklyActivity();
  const recentQuery = useRecentActivity();
  const upcomingQuery = useUpcomingReviews();
  const [weeklyMetric, setWeeklyMetric] = useState<WeeklyMetric>('donations');

  const [auditOpen, setAuditOpen] = useState(false);
  const [auditItems, setAuditItems] = useState<RecentActivityItem[] | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  useEffect(() => {
    if (!auditOpen) return;
    let cancelled = false;
    setAuditLoading(true);
    setAuditError(null);
    setAuditItems(null);
    apiGet<RecentActivityItem[]>('/api/AdminDashboard/activity-log').then((res) => {
      if (cancelled) return;
      setAuditLoading(false);
      if (res.data !== null) {
        setAuditItems(res.data);
      } else {
        setAuditError(res.error ?? 'Could not load audit log');
        setAuditItems([]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [auditOpen]);

  const kpiCards = [
    {
      label: 'Active Residents',
      value: kpis.loading
        ? '…'
        : kpis.data
          ? kpis.data.activeResidents.toLocaleString()
          : '—',
      sub: null as string | null,
    },
    {
      label: 'Recent Donations',
      value: kpis.loading
        ? '…'
        : kpis.data
          ? formatPhp(kpis.data.recentDonationsAmount)
          : '—',
      sub: 'Last 7 days' as string | null,
    },
    {
      label: 'Upcoming Reviews',
      value: kpis.loading
        ? '…'
        : kpis.data
          ? kpis.data.upcomingReviews.toLocaleString()
          : '—',
      sub: 'Next 7 days' as string | null,
    },
    {
      label: 'Avg. Education Progress',
      value: kpis.loading
        ? '…'
        : kpis.data
          ? `${kpis.data.avgProgress}%`
          : '—',
      sub: 'All residents' as string | null,
    },
    {
      label: 'Avg. Health Score',
      value: kpis.loading
        ? '…'
        : kpis.data
          ? formatHealthScore(kpis.data.avgHealthScore)
          : '—',
      sub: 'All residents' as string | null,
    },
    {
      label: 'Incident Count',
      value: kpis.loading
        ? '…'
        : kpis.data
          ? kpis.data.incidentCount.toLocaleString()
          : '—',
      sub: 'This month' as string | null,
    },
  ];

  const safehouses = safehousesQuery.data ?? [];
  const weekly = weeklyQuery.data ?? [];
  const recent = recentQuery.data ?? [];
  const upcoming = upcomingQuery.data ?? [];

  const maxWeekly = Math.max(1, ...weekly.map((d) => d[weeklyMetric]));
  const weeklyMetricLabel =
    weeklyMetric === 'donations'
      ? 'Donations'
      : weeklyMetric === 'homeVisitations'
        ? 'Home Visits'
        : 'Recordings';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StaffHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 lg:py-16">
        {/* Title */}
        <div className="mb-12">
          <h1 className="text-4xl lg:text-5xl font-serif text-foreground mb-4">Command Center</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Staff oversight and operational orchestration of global outreach initiatives and safehouse management.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
          {kpiCards.map(({ label, value, sub }) => (
            <div
              key={label}
              className="rounded-2xl border border-border bg-white p-8 shadow-sm hover:shadow-md transition-shadow"
              role="region"
              aria-label={`${label}: ${value}`}
            >
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                {label}
              </p>
              <p className="text-4xl font-serif text-foreground">{value}</p>
              <p className="text-sm text-primary mt-3 font-medium h-5">{sub || ''}</p>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Safehouse Overview — 2 cols */}
          <section
            className="lg:col-span-2 rounded-3xl border border-border bg-white p-8 shadow-sm"
            aria-labelledby="safehouse-heading"
          >
            <div className="flex items-end justify-between mb-8 pb-4 border-b border-border/60">
              <h2 id="safehouse-heading" className="text-2xl font-serif text-foreground">
                Safehouse Occupancy
              </h2>
              <span className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Live Data</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              {safehouses.map(({
                safehouseId,
                name,
                status,
                occupied,
                capacity,
                pct,
                avgHealthScore,
                avgEducationProgress,
                incidentCount,
              }) => (
                <div
                  key={safehouseId}
                  className="rounded-2xl border border-border overflow-hidden bg-background hover:border-primary/30 transition-colors"
                  aria-label={`${name}: ${status}, ${occupied}/${capacity} occupied`}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-foreground">{name}</h3>
                      <div className="flex items-center gap-2">
                        {incidentCount > 0 ? (
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            Alert: {incidentCount} incident{incidentCount === 1 ? '' : 's'}
                          </span>
                        ) : null}
                        <span
                          className={`
                            text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full
                            ${status.toUpperCase() === 'ACTIVE'
                              ? 'bg-primary/10 text-primary border border-primary/20'
                              : 'bg-destructive/10 text-destructive border border-destructive/20'
                            }
                          `}
                        >
                          {status}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 font-medium">
                      <span className="text-foreground text-lg">{occupied}</span> / {capacity} residents
                    </p>
                    <div
                      className="h-2 rounded-full bg-border overflow-hidden"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${name} capacity: ${pct}%`}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${pct >= 100 ? 'bg-destructive' : 'bg-primary'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-right font-medium">{pct}% Full</p>
                    <div className="mt-4 pt-3 border-t border-border/60 grid grid-cols-2 gap-3 text-xs">
                      <p className="text-muted-foreground">
                        Health score: <span className="text-foreground font-semibold">{formatHealthScore(avgHealthScore)}</span>
                      </p>
                      <p className="text-muted-foreground text-right">
                        Edu progress: <span className="text-foreground font-semibold">{avgEducationProgress}%</span>
                      </p>
                      <p className="text-muted-foreground col-span-2">
                        Incidents this month: <span className="text-foreground font-semibold">{incidentCount}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Right Aside */}
          <aside className="space-y-8">
            {/* Bar chart — Weekly Activity */}
            <div className="rounded-3xl p-8 bg-foreground text-white shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50" />
              <div className="relative z-10 mb-6">
                <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest mb-4">
                  Weekly Activity
                </h3>
                <div className="inline-flex rounded-xl border border-white/15 bg-white/5 p-1">
                  <button
                    type="button"
                    className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-lg transition-colors ${
                      weeklyMetric === 'donations'
                        ? 'bg-primary text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                    onClick={() => setWeeklyMetric('donations')}
                  >
                    Donations
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-lg transition-colors ${
                      weeklyMetric === 'homeVisitations'
                        ? 'bg-primary text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                    onClick={() => setWeeklyMetric('homeVisitations')}
                  >
                    Visits
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-lg transition-colors ${
                      weeklyMetric === 'processRecordings'
                        ? 'bg-primary text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                    onClick={() => setWeeklyMetric('processRecordings')}
                  >
                    Recordings
                  </button>
                </div>
              </div>
              <div className="flex items-end gap-3 h-32 relative z-10" aria-label={`${weeklyMetricLabel} by week bar chart`}>
                {weekly.map((d) => {
                  const value = d[weeklyMetric];
                  const h = Math.round((value / maxWeekly) * 100);
                  const xLabel = formatWeekRange(d.date);
                  return (
                    <div key={d.date} className="flex-1 h-full flex flex-col items-center justify-end gap-2 group">
                      <div
                        className="w-full bg-primary/80 rounded-t-sm group-hover:bg-primary transition-colors min-h-[2px]"
                        style={{ height: `${h}%` }}
                        aria-label={`${xLabel}: ${value} ${weeklyMetricLabel.toLowerCase()}`}
                        title={`${d.day}: ${value} ${weeklyMetricLabel.toLowerCase()} (${d.processRecordings} recordings, ${d.homeVisitations} visits, ${d.donations} donations)`}
                      />
                      <span
                        className="text-[10px] text-white/50 font-medium uppercase tracking-wider text-center leading-tight"
                        title={xLabel}
                      >
                        {xLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-white/40 uppercase tracking-wider mt-4 relative z-10">
                {weeklyMetricLabel} per week
              </p>
            </div>

            {/* Recent Activity */}
            <div className="rounded-3xl border border-border bg-white p-8 shadow-sm">
              <h3 className="text-xl font-serif text-foreground mb-6">Recent Activity</h3>
              {recent.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity.</p>
              ) : (
                <ActivityFeedList items={recent} />
              )}
              <button
                type="button"
                className="mt-8 w-full py-3 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-background transition-colors"
                aria-label="View full audit log"
                aria-haspopup="dialog"
                aria-expanded={auditOpen}
                onClick={() => setAuditOpen(true)}
              >
                View Full Audit Log
              </button>
            </div>

            {/* Upcoming Reviews */}
            <div className="rounded-3xl border border-border bg-white p-8 shadow-sm">
              <h3 className="text-xl font-serif text-foreground mb-6">Upcoming Reviews</h3>
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">No case conferences scheduled.</p>
              ) : (
                <ul className="space-y-4">
                  {upcoming.map((r) => (
                    <li key={r.planId} className="flex justify-between items-start gap-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">{r.residentCode}</p>
                        <p className="text-xs text-muted-foreground">{r.planCategory}</p>
                      </div>
                      <span className="text-xs text-primary font-medium whitespace-nowrap">
                        {new Date(r.caseConferenceDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </main>

      <PublicFooter />

      {auditOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAuditOpen(false);
          }}
        >
          <div
            className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl border border-border bg-white shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="audit-log-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4 shrink-0">
              <h2 id="audit-log-title" className="text-lg font-serif text-foreground">
                Full activity log
              </h2>
              <button
                type="button"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-background hover:text-foreground"
                onClick={() => setAuditOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5 flex-1 min-h-0">
              {auditLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : auditError ? (
                <p className="text-sm text-destructive">{auditError}</p>
              ) : auditItems && auditItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity recorded.</p>
              ) : (
                <ActivityFeedList items={auditItems ?? []} />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
