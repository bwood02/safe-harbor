import StaffHeader from '@/components/shared/StaffHeader';
import PublicFooter from '@/components/shared/PublicFooter';

export default function DonorsContributionsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StaffHeader />
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-20">
        <h1 className="text-5xl font-serif text-foreground mb-4">Donors & Contributions</h1>
        <p className="text-lg text-muted-foreground">
          Donor management page — coming in slice 4.
        </p>
      </main>
      <PublicFooter />
    </div>
  );
}
