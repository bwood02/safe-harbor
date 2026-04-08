import StaffHeader from '@/components/shared/StaffHeader';
import PublicFooter from '@/components/shared/PublicFooter';

export default function ProcessRecordingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StaffHeader />
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-20">
        <h1 className="text-5xl font-serif text-foreground mb-4">Process Recording</h1>
        <p className="text-lg text-muted-foreground">
          Counseling session notes — coming in slice 5.
        </p>
      </main>
      <PublicFooter />
    </div>
  );
}
