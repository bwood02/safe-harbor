import { Link, useLocation } from 'wouter';

const navLinks = [
  { to: '/impact', label: 'Impact' },
  { to: '/admin', label: 'Admin' },
  { to: '/caseload', label: 'Caseload' },
];

export default function StaffHeader() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/60">
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/impact">
          <span className="font-serif italic font-medium text-foreground text-2xl tracking-wide cursor-pointer select-none">
            Safe Harbor
          </span>
        </Link>
        <nav aria-label="Main navigation">
          <ul className="flex items-center gap-6">
            {navLinks.map(({ to, label }) => {
              const isActive = location === to || (location === '/' && to === '/impact');
              return (
                <li key={to}>
                  <Link href={to}>
                    <span
                      className={`
                        text-lg font-medium cursor-pointer transition-colors relative py-1
                        ${isActive
                          ? 'text-primary'
                          : 'text-foreground/70 hover:text-foreground'
                        }
                      `}
                    >
                      {label}
                      {isActive && (
                        <span className="absolute left-0 right-0 -bottom-1 h-[2px] bg-primary rounded-full" aria-hidden="true" />
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
