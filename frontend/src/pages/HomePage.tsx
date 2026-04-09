import { Link } from 'react-router-dom';
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

  const pillars = [
    {
      number: 1,
      title: 'Safety',
      blurb:
        'Safety is the number one focus of Safe Harbor since it is the first step of healing.',
    },
    {
      number: 2,
      title: 'Healing',
      blurb:
        'Once a child trusts that they are safe they begin the healing process.',
    },
    {
      number: 3,
      title: 'Justice',
      blurb:
        'Safe Harbor does not encourage or discourage the children to file cases, we support the children in pursuing what justice is for them.',
    },
    {
      number: 4,
      title: 'Empowerment',
      blurb:
        'The goal of Safe Harbor is to help move children who have suffered abuse from a mindset of victimhood into a mindset of leadership and advocacy.',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />

      <main className="flex-1">
        <section
          className="relative min-h-[calc(100svh-72px)] flex items-center overflow-hidden py-6 md:py-8"
          aria-labelledby="home-hero-headline"
        >
          <div className="absolute inset-0 sh-warm-hero-bg -z-10" />

          <div className="max-w-6xl mx-auto px-6 relative z-10 w-full">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
              <div className="w-full md:flex-1 md:pr-6">
                <span className="inline-block py-1 px-3 rounded-full bg-secondary/30 text-foreground text-xs sm:text-sm font-semibold tracking-wider uppercase mb-4 md:mb-5 border border-secondary/50">
                  Safe Harbor
                </span>
                <h1
                  id="home-hero-headline"
                  className="font-serif font-medium text-foreground leading-[1.05] mb-4 md:mb-5 text-[clamp(2rem,5vw,4.5rem)]"
                >
                  Every girl deserves a safe harbor
                </h1>
                <p className="text-[clamp(1rem,1.6vw,1.25rem)] text-muted-foreground leading-relaxed mb-6 md:mb-8">
                  Restoring dignity, healing trauma, and building futures for
                  survivors of trafficking and exploitation in the Philippines.
                </p>

                <div className="flex flex-wrap gap-3 sm:gap-4">
                  <a
                    href="#donate"
                    className="inline-flex items-center justify-center min-h-[48px] px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-full bg-primary text-white text-base sm:text-lg font-medium hover:bg-primary/90 transition-colors shadow-sm whitespace-nowrap"
                  >
                    Donate
                  </a>
                  <Link to="/impact">
                    <span className="inline-flex items-center justify-center min-h-[48px] px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-full border border-foreground/20 text-foreground text-base sm:text-lg font-medium hover:bg-foreground/5 transition-colors cursor-pointer whitespace-nowrap">
                      Read our impact
                    </span>
                  </Link>
                  <Link to="/admin">
                    <span className="inline-flex items-center justify-center min-h-[48px] px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-full text-foreground/80 text-base sm:text-lg font-medium hover:text-foreground transition-colors cursor-pointer whitespace-nowrap">
                      Staff login
                    </span>
                  </Link>
                </div>
              </div>

              <div className="w-full md:w-[42%] lg:w-[44%] md:ml-auto relative flex justify-center md:justify-end lg:pl-6">
                <div className="relative w-full rounded-[2rem] overflow-hidden shadow-2xl aspect-[16/10] md:aspect-[4/4] lg:aspect-[4/3] max-h-[52svh] md:max-h-[58svh] sh-warm-hero-art-base">
                  <img
                    src='/images/landing-page-hands.jpeg'
                    alt="Hands holding in solidarity"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
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

        <section className="max-w-6xl w-full mx-auto px-6 pb-24">
          <p className="text-sm font-medium text-primary text-center mb-2">What we do</p>
          <h3 className="text-4xl md:text-5xl font-serif text-foreground text-center mb-12">
            Provide Safety, Healing, and Empowerment
          </h3>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <p className="text-base text-muted-foreground leading-relaxed">
              Safe Harbor provides trauma-informed residential care, education,
              and reintegration support to girls who have survived trafficking
              and exploitation. We walk alongside each girl on her journey to
              healing and independence.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((p) => (
              <article
                key={p.title}
                className="relative bg-white border border-border rounded-2xl p-6 shadow-sm"
              >
                <span className="absolute top-4 right-4 text-xs font-bold text-muted-foreground">
                  {p.number}
                </span>
                <h4 className="text-2xl font-serif text-foreground mb-3">{p.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.blurb}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
