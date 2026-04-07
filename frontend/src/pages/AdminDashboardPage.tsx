import { Link } from 'react-router-dom'
import { StaffHeader } from '../components/layout/StaffHeader'

const safehouses = [
  { name: 'Northern Haven', status: 'ACTIVE' as const, occupancy: '33 / 40', pct: 82 },
  { name: 'City Sanctuary', status: 'AT CAPACITY' as const, occupancy: '40 / 40', pct: 100 },
  { name: 'Valley Retreat', status: 'ACTIVE' as const, occupancy: '28 / 36', pct: 78 },
  { name: 'Coastal Refuge', status: 'ACTIVE' as const, occupancy: '19 / 30', pct: 63 },
] as const

const activity = [
  { title: 'New Intake at City Sanctuary', meta: '2 minutes ago — ID: #93081' },
  { title: 'Grant Disbursement Processed', meta: '14 minutes ago — Finance Dept' },
  { title: 'Conference Schedule Updated', meta: '1 hour ago — Admin Portal' },
  { title: 'Capacity Alert: Valley Retreat', meta: '3 hours ago — Automated System' },
] as const

const weekBars = [40, 65, 45, 80, 55, 70, 50]

export function AdminDashboardPage() {
  return (
    <div className="wireframe-static min-h-screen bg-sh-canvas text-sh-ink">
      <StaffHeader />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-black uppercase tracking-tight text-sh-deep">Command Center</h1>
        <p className="mt-3 max-w-4xl text-xs font-semibold uppercase leading-relaxed text-sh-muted">
          Staff oversight and operational orchestration of global outreach initiatives and safehouse management.
        </p>

        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Key metrics">
          <div className="rounded-xl border border-sh-mist-deep/50 bg-sh-surface p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-sh-muted">Active Residents</p>
            <p className="mt-3 text-3xl font-black text-sh-deep underline decoration-sh-primary decoration-4 underline-offset-8">
              1,248
            </p>
          </div>
          <div className="rounded-xl border border-sh-mist-deep/50 bg-sh-surface p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-sh-muted">Recent Donations</p>
            <p className="mt-3 text-3xl font-black text-sh-deep">$42k</p>
            <p className="mt-1 text-[10px] font-bold uppercase text-sh-subtle">Last 24 hours</p>
          </div>
          <div className="rounded-xl border border-sh-mist-deep/50 bg-sh-surface p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-sh-muted">Upcoming Conferences</p>
            <p className="mt-3 text-3xl font-black text-sh-deep decoration-dotted decoration-2 underline underline-offset-8">
              07
            </p>
          </div>
          <div className="rounded-xl border border-sh-mist-deep/50 bg-sh-surface p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-sh-muted">Avg. Progress</p>
            <p className="mt-3 text-3xl font-black text-sh-deep">84%</p>
            <p className="mt-1 text-[10px] font-bold uppercase text-sh-subtle">Retention rate</p>
          </div>
        </section>

        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-black uppercase tracking-wide text-sh-deep">Safehouse Overview</h2>
              <span className="text-[10px] font-bold uppercase text-sh-subtle">Live occupancy data</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {safehouses.map((sh) => (
                <div key={sh.name} className="rounded-xl border border-sh-mist-deep/50 bg-sh-surface p-4 shadow-sm">
                  <div className="flex h-28 items-center justify-center rounded-lg bg-gradient-to-br from-sh-mist to-sh-accent-soft/50" aria-hidden>
                    <span className="text-3xl text-sh-accent">⌂</span>
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-2">
                    <h3 className="text-xs font-black uppercase tracking-wide text-sh-deep">{sh.name}</h3>
                    <span
                      className={`shrink-0 rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase ${
                        sh.status === 'ACTIVE'
                          ? 'border-sh-deep bg-sh-deep text-white'
                          : 'border-sh-mist-deep bg-sh-mist text-sh-deep'
                      }`}
                    >
                      {sh.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-sh-muted">{sh.occupancy}</p>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-sh-mist-deep/40">
                    <div className="h-full rounded-full bg-sh-primary" style={{ width: `${sh.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-8">
            <div className="rounded-xl bg-gradient-to-b from-sh-deep to-sh-primary p-4 text-white shadow-md">
              <div className="flex h-40 items-end justify-between gap-1 px-2">
                {weekBars.map((h, i) => (
                  <div key={i} className="flex w-full flex-col items-center justify-end gap-2">
                    <div
                      className="w-full rounded-t-sm bg-white/90"
                      style={{ height: `${h}%`, minHeight: '0.75rem', maxHeight: '100%' }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[10px] font-bold uppercase text-sh-accent-soft">
                <span>Mon</span>
                <span>Sun</span>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-black uppercase tracking-wide text-sh-deep">Recent Activity</h2>
              <ul className="mt-4 space-y-4">
                {activity.map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <div className="mt-0.5 h-6 w-6 shrink-0 rounded-full border border-sh-accent/50 bg-sh-mist" />
                    <div>
                      <p className="text-xs font-bold text-sh-ink">{item.title}</p>
                      <p className="mt-1 text-[11px] text-sh-muted">{item.meta}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="mt-6 w-full rounded-md border border-sh-mist-deep bg-sh-mist py-2 text-xs font-bold uppercase tracking-wide text-sh-deep"
                aria-disabled
              >
                View Audit Log
              </button>
            </div>
          </aside>
        </div>
      </main>

      <footer className="mt-12 border-t border-sh-mist-deep/40 bg-sh-mist/50">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-[11px] uppercase">
          <Link to="/admin" className="font-black tracking-tight text-sh-deep hover:text-sh-primary">
            Safe Harbor
          </Link>
          <div className="flex gap-4 font-semibold text-sh-muted">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
          <div className="text-sh-subtle">© 2026 Safe Harbor. Internal use.</div>
        </div>
      </footer>
    </div>
  )
}
