import { Link } from 'wouter';
import PublicHeader from '@/components/shared/PublicHeader';
import PublicFooter from '@/components/shared/PublicFooter';
import { useHomepageStats } from '@/hooks/usePublicImpact';

export default function HomePage() {
  const { data, loading, isMock } = useHomepageStats();

  const stats = [
    { label: 'Girls supported', value: data.girlsSupported },
    { label: 'Safehouses', value: data.safehouses },
    { label: 'Donors', value: data.donors },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />

      <main className="flex-1">
        <section className="max-w-6xl w-full mx-auto px-6 pt-20 pb-16 text-center">
          <h1 className="text-5xl md:text-6xl font-serif text-foreground leading-tight mb-6">
            Every girl deserves a safe harbor
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
            Restoring dignity, healing trauma, and building futures for
            survivors of trafficking and exploitation in the Philippines.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="#donate"
              className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              Donate
            </a>
            <Link href="/impact">
              <span className="px-6 py-3 rounded-full border border-foreground/20 text-foreground font-medium hover:bg-foreground/5 transition-colors cursor-pointer">
                Read our impact
              </span>
            </Link>
            <Link href="/admin">
              <span className="px-6 py-3 rounded-full text-foreground/80 font-medium hover:text-foreground transition-colors cursor-pointer">
                Staff login
              </span>
            </Link>
          </div>
        </section>

        <section
          aria-label="Impact at a glance"
          className="max-w-6xl w-full mx-auto px-6 pb-20"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-white border border-border rounded-2xl p-8 text-center shadow-sm"
              >
                <div className="text-5xl font-serif text-foreground mb-2">
                  {loading ? '—' : s.value.toLocaleString()}
                </div>
                <div className="text-sm uppercase tracking-wide text-muted-foreground">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
          {isMock && (
            <p className="text-xs text-muted-foreground text-center mt-6">
              Showing sample figures — backend unreachable.
            </p>
          )}
        </section>

        <section className="max-w-3xl w-full mx-auto px-6 pb-24 text-center">
          <h2 className="text-3xl font-serif text-foreground mb-4">Our mission</h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Safe Harbor provides trauma-informed residential care, education,
            and reintegration support to girls who have survived trafficking
            and exploitation. We walk alongside each girl on her journey to
            healing and independence.
          </p>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
