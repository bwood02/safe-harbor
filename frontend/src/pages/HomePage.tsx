import PublicHeader from '@/components/shared/PublicHeader';
import PublicFooter from '@/components/shared/PublicFooter';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-20">
        <h1 className="text-5xl font-serif text-foreground mb-4">Safe Harbor</h1>
        <p className="text-lg text-muted-foreground">
          Home / Landing page — coming in slice 1.
        </p>
      </main>
      <PublicFooter />
    </div>
  );
}
