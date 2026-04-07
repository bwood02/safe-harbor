import StaffHeader from '@/components/shared/StaffHeader';
import PublicFooter from '@/components/shared/PublicFooter';
import { useAdminKpis, useSafehouses } from '@/hooks/useMockData';

// Bar chart + recent activity not yet wired — empty until we have a data source.
const barHeights: number[] = [];
const barDays: string[] = [];
const recentActivity: { title: string; meta: string; sub: string }[] = [];

function formatCurrency(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

export default function AdminDashboardPage() {
  const kpis = useAdminKpis();
  const safehousesQuery = useSafehouses();

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
          ? formatCurrency(kpis.data.recentDonationsAmount)
          : '—',
      sub: 'Last 7 days' as string | null,
    },
    {
      label: 'Upcoming Reviews',
      value: kpis.loading ? '…' : '—', // not wired yet
      sub: 'This week' as string | null,
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
  ];

  const safehouses = safehousesQuery.data ?? [];

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
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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
              {safehouses.map(({ name, status, occupied, capacity, pct }) => (
                <div
                  key={name}
                  className="rounded-2xl border border-border overflow-hidden bg-background hover:border-primary/30 transition-colors"
                  aria-label={`${name}: ${status}, ${occupied}/${capacity} occupied`}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-foreground">{name}</h3>
                      <span
                        className={`
                          text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full
                          ${status === 'ACTIVE'
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'bg-destructive/10 text-destructive border border-destructive/20'
                          }
                        `}
                      >
                        {status}
                      </span>
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
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Right Aside */}
          <aside className="space-y-8">
            {/* Bar chart */}
            <div className="rounded-3xl p-8 bg-foreground text-white shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50" />
              <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest mb-8 relative z-10">
                Weekly Activity
              </h3>
              <div className="flex items-end gap-3 h-32 relative z-10" aria-label="Weekly activity bar chart">
                {barHeights.map((h, i) => (
                  <div key={barDays[i]} className="flex-1 flex flex-col items-center gap-2 group">
                    <div
                      className="w-full bg-primary/80 rounded-t-sm group-hover:bg-primary transition-colors"
                      style={{ height: `${h}%` }}
                      aria-label={`${barDays[i]}: ${h}% activity`}
                    />
                    <span className="text-[10px] text-white/50 font-medium uppercase tracking-wider">
                      {i === 0 ? 'Mon' : i === 6 ? 'Sun' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-3xl border border-border bg-white p-8 shadow-sm">
              <h3 className="text-xl font-serif text-foreground mb-6">Recent Activity</h3>
              <ul className="space-y-5">
                {recentActivity.map(({ title, meta, sub }) => (
                  <li key={title} className="flex gap-4 items-start group">
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-primary/60 group-hover:bg-primary transition-colors flex-shrink-0" aria-hidden="true" />
                    <div>
                      <p className="text-base font-medium text-foreground leading-snug mb-1">{title}</p>
                      <p className="text-sm text-muted-foreground">
                        {meta} <span className="mx-1 opacity-50">•</span> {sub}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                className="mt-8 w-full py-3 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-background transition-colors"
                aria-label="View full audit log"
              >
                View Full Audit Log
              </button>
            </div>
          </aside>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
