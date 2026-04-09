import StaffHeader from '@/components/shared/StaffHeader';
import PublicFooter from '@/components/shared/PublicFooter';

export default function VisitationLogsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StaffHeader />
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 lg:py-16">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
            Internal Use Only
          </p>
          <h1 className="text-4xl lg:text-5xl font-serif text-foreground mb-6">
            Home Visitation &amp; Case Conferences
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
            Placeholder — vertical slice under construction.
          </p>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
