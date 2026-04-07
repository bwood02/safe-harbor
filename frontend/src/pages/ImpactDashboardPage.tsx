import { Link } from 'react-router-dom'
import { StaffHeader } from '../components/layout/StaffHeader'
import { PublicFooter } from '../components/layout/PublicFooter'
import { featuredStory } from '../data/featuredStory'
import {
  useImpactSummary,
  useOutcomeDistribution,
  useDonationsMonthlyTrend,
} from '../hooks/useImpactData'

function formatPHP(n: number): string {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₱${(n / 1_000).toFixed(1)}k`
  return `₱${n.toFixed(0)}`
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

const stories = [
  {
    title: 'Finding Voice',
    body: 'Structured counseling milestones tied to anonymized outcome indicators across our network of safe homes.',
  },
  {
    title: 'Reconnecting with Family',
    body: 'Gradual, supervised contact plans aligned with case conferences and partner agency coordination.',
  },
  {
    title: 'Academic Excellence',
    body: 'Education records tracked alongside wellbeing goals to support measurable reintegration readiness.',
  },
] as const

export function ImpactDashboardPage() {
  const summary = useImpactSummary()
  const outcomes = useOutcomeDistribution()
  const trend = useDonationsMonthlyTrend()

  const reintegrationPct =
    summary.data && summary.data.total_residents > 0
      ? Math.round((summary.data.completed_reintegrations / summary.data.total_residents) * 100)
      : 0

  const cards = [
    {
      label: 'Total Girls Supported',
      value: summary.loading
        ? '—'
        : summary.error
          ? '!'
          : summary.data
            ? formatNumber(summary.data.total_residents)
            : '0',
    },
    {
      label: 'Successful Reintegrations',
      value: summary.loading ? '—' : summary.error ? '!' : `${reintegrationPct}%`,
    },
    {
      label: 'Total Donations (PHP)',
      value: summary.loading
        ? '—'
        : summary.error
          ? '!'
          : summary.data
            ? formatPHP(summary.data.total_donations_php)
            : '₱0',
    },
  ]

  const outcomeTotal = outcomes.data?.reduce((s, r) => s + r.count, 0) ?? 0
  const trendMax = trend.data?.reduce((m, r) => Math.max(m, r.total_php), 0) ?? 0
  const recentTrend = trend.data?.slice(-12) ?? []

  return (
    <div className="min-h-screen bg-sh-canvas text-sh-ink">
      <StaffHeader />

      <main>
        {/* Featured story hero */}
        <section
          className="border-b border-sh-mist-deep/50 bg-gradient-to-br from-sh-hero-from via-sh-surface to-sh-accent-soft/40"
          aria-labelledby="featured-story-heading"
        >
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-sh-accent">Featured restoration story</p>
              <h2 id="featured-story-heading" className="mt-3 text-3xl font-black leading-tight tracking-tight text-sh-deep md:text-4xl">
                {featuredStory.headline}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-sh-muted md:text-base">{featuredStory.dek}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-md border-2 border-sh-primary bg-sh-surface px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-sh-primary shadow-sm transition-colors hover:bg-sh-mist"
                  aria-disabled
                >
                  Learn more
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-md bg-sh-warm px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-sh-warm-hover"
                  aria-disabled
                >
                  Donate now
                </button>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-sh-mist-deep/40 bg-sh-mist/60 shadow-md">
              <div className="aspect-[4/3] w-full bg-gradient-to-br from-sh-sage-soft to-sh-accent-soft" aria-hidden />
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-sh-deep/80">Finding Voice</p>
                <p className="mt-1 text-sm font-medium text-sh-muted">A calm space to speak — and be heard.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-12">
          <h1 className="text-4xl font-black uppercase tracking-tight text-sh-deep">Our Impact</h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-sh-muted md:text-base">
            Empirical transparency in our journey toward healing. We track every milestone not as a number, but as a life
            reclaimed from the shadows of exploitation.
          </p>

          {summary.error && (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              Could not load impact data: {summary.error}
            </p>
          )}
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-sh-mist-deep/50 bg-sh-surface p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-sh-muted">{card.label}</p>
                <p className="mt-4 text-3xl font-black text-sh-deep">
                  {summary.loading ? <span className="inline-block h-8 w-24 animate-pulse rounded bg-sh-mist-deep/60" /> : card.value}
                </p>
              </div>
            ))}
          </div>

          {!trend.loading && !trend.error && recentTrend.length > 0 && (
            <div className="mt-10 rounded-xl border border-sh-mist-deep/50 bg-sh-surface p-6 shadow-sm">
              <div className="flex items-end justify-between">
                <h2 className="text-xs font-black uppercase tracking-wide text-sh-deep">Donations · Last 12 Months</h2>
                <span className="text-[10px] font-bold uppercase text-sh-subtle">PHP</span>
              </div>
              <div className="mt-6 grid h-40 grid-flow-col items-end gap-2">
                {recentTrend.map((row) => {
                  const pct = trendMax > 0 ? (row.total_php / trendMax) * 100 : 0
                  return (
                    <div
                      key={row.month}
                      className="relative flex h-full flex-col justify-end"
                      title={`${row.month}: ${formatPHP(row.total_php)}`}
                    >
                      <div
                        className="rounded-t-sm bg-sh-primary/80 transition-all hover:bg-sh-primary"
                        style={{ height: `${Math.max(pct, 2)}%` }}
                      />
                      <span className="mt-1 text-center text-[9px] font-semibold text-sh-subtle">
                        {row.month.slice(5)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        <section className="border-t border-sh-mist-deep/40 bg-sh-surface">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-2">
            <div className="rounded-xl border border-sh-mist-deep/50 bg-sh-canvas p-6 shadow-sm">
              <h2 className="text-xs font-black uppercase tracking-wide text-sh-deep">Case Outcome Distribution</h2>
              {outcomes.loading && (
                <ul className="mt-6 space-y-4" aria-busy="true">
                  {[1, 2, 3, 4].map((i) => (
                    <li key={i}>
                      <div className="h-3 w-full animate-pulse rounded bg-sh-mist-deep/60" />
                      <div className="mt-2 h-2 w-full animate-pulse rounded-full bg-sh-mist-deep/40" />
                    </li>
                  ))}
                </ul>
              )}
              {outcomes.error && (
                <p className="mt-4 text-xs text-red-700">Could not load outcomes: {outcomes.error}</p>
              )}
              {outcomes.data && outcomeTotal > 0 && (
                <ul className="mt-6 space-y-4">
                  {outcomes.data.map((row) => {
                    const pct = Math.round((row.count / outcomeTotal) * 100)
                    return (
                      <li key={row.label}>
                        <div className="flex items-center justify-between text-xs font-semibold text-sh-ink">
                          <span>{row.label}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-sh-mist-deep/40">
                          <div className="h-full rounded-full bg-sh-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <div className="flex flex-col justify-between rounded-xl bg-gradient-to-br from-sh-deep to-sh-primary p-8 text-white shadow-md">
              <div className="text-5xl font-serif leading-none text-white/30">“</div>
              <p className="mt-4 text-sm leading-relaxed text-white/95">
                Data allows us to see the scale, but empathy allows us to see the child. Our success is measured in the
                silence of a peaceful night&apos;s sleep.
              </p>
              <p className="mt-6 text-xs font-bold uppercase tracking-wide text-sh-accent-soft">
                Sarah Al-Mansour, Clinical Director
              </p>
            </div>
          </div>
        </section>

        <section id="stories" className="scroll-mt-24 border-t border-sh-mist-deep/40 bg-sh-mist/50">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-lg font-black uppercase tracking-wide text-sh-deep">Restoration Stories</h2>
              <Link
                to="/impact#stories"
                className="text-xs font-semibold uppercase tracking-wide text-sh-primary underline decoration-sh-accent underline-offset-4 hover:text-sh-primary-hover"
              >
                View All Impact Narratives
              </Link>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {stories.map((s) => (
                <article key={s.title} className="rounded-xl border border-sh-mist-deep/50 bg-sh-surface p-4 shadow-sm">
                  <div className="aspect-square w-full rounded-lg bg-gradient-to-br from-sh-sage-soft to-sh-mist" aria-hidden />
                  <h3 className="mt-4 text-sm font-bold uppercase tracking-wide text-sh-deep">{s.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-sh-muted">{s.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
