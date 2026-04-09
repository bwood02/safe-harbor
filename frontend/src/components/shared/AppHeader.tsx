import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { logoutUser } from '@/lib/AuthApi';
import LogoMark from '@/components/shared/LogoMark';

type NavLinkItem = {
  to: string;
  label: string;
};

const publicLinks: NavLinkItem[] = [
  { to: '/', label: 'Home' },
  { to: '/impact', label: 'Impact' },
];

export default function AppHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { authSession, isAuthenticated, isLoading, refreshAuthState } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const roles = authSession.roles ?? [];
  const isAdmin = roles.includes('Admin');
  const isDonor = roles.includes('Donor');

  async function handleLogout() {
    try {
      await logoutUser();
      await refreshAuthState();
      setMenuOpen(false);
      navigate('/logout');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  const roleLinks: NavLinkItem[] = [];

  if (isAdmin) {
    roleLinks.push(
      { to: '/admin', label: 'Admin' },
      { to: '/caseload', label: 'Caseload' },
      { to: '/process-recordings', label: 'Process Recordings' },
      { to: '/visitation-logs', label: 'Visitation Logs' },
      { to: '/reports', label: 'Reports' },
      { to: '/donors', label: 'Donor Contributions' },
      { to: '/social-media', label: 'Social Media' }
    );
  }

  if (isDonor) {
    roleLinks.push({ to: '/donor', label: 'My Dashboard' });
  }

  const navLinks = [...publicLinks, ...roleLinks];

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  function renderNavLink({ to, label }: NavLinkItem, variant: 'desktop' | 'mobile') {
    const isActive = pathname === to;
    if (variant === 'desktop') {
      return (
        <li key={to}>
          <Link to={to}>
            <span
              className={`text-base xl:text-lg font-medium cursor-pointer transition-colors relative py-1 whitespace-nowrap ${
                isActive ? 'text-primary' : 'text-foreground/70 hover:text-foreground'
              }`}
            >
              {label}
              {isActive && (
                <span
                  className="absolute left-0 right-0 -bottom-1 h-[2px] bg-primary rounded-full"
                  aria-hidden="true"
                />
              )}
            </span>
          </Link>
        </li>
      );
    }
    return (
      <li key={to}>
        <Link to={to} onClick={() => setMenuOpen(false)}>
          <span
            className={`block px-5 py-3 text-base font-medium rounded-lg transition-colors ${
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-foreground/80 hover:bg-foreground/5 hover:text-foreground'
            }`}
          >
            {label}
          </span>
        </Link>
      </li>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/60">
      <div
        ref={menuRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4"
      >
        <Link to="/" className="shrink-0 flex items-center gap-2 cursor-pointer">
          <LogoMark className="w-8 h-8 sm:w-9 sm:h-9 text-primary" />
          <span className="font-serif italic font-medium text-foreground text-xl sm:text-2xl tracking-wide select-none whitespace-nowrap">
            Safe Harbor
          </span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main navigation" className="hidden lg:flex flex-1">
          <ul className="flex items-center justify-end gap-5 xl:gap-6 w-full">
            {navLinks.map((link) => renderNavLink(link, 'desktop'))}

            {!isLoading && !isAuthenticated && (
              <>
                <li>
                  <Link to="/register">
                    <span className="text-sm xl:text-base font-medium px-4 py-2 rounded-full border border-foreground/20 text-foreground hover:bg-foreground/5 transition-colors cursor-pointer whitespace-nowrap">
                      Register
                    </span>
                  </Link>
                </li>
                <li>
                  <Link to="/login">
                    <span className="text-sm xl:text-base font-medium px-4 py-2 rounded-full border border-foreground/20 text-foreground hover:bg-foreground/5 transition-colors cursor-pointer whitespace-nowrap">
                      Login
                    </span>
                  </Link>
                </li>
              </>
            )}

            {!isLoading && isAuthenticated && (
              <li>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-sm xl:text-base font-medium px-4 py-2 rounded-full border border-foreground/20 text-foreground hover:bg-foreground/5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Logout
                </button>
              </li>
            )}
          </ul>
        </nav>

        {/* Mobile burger button */}
        <button
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((v) => !v)}
          className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-foreground/15 text-foreground hover:bg-foreground/5 transition-colors"
        >
          {menuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>

        {/* Mobile menu panel */}
        {menuOpen && (
          <nav
            id="mobile-menu"
            aria-label="Mobile navigation"
            className="lg:hidden absolute left-0 right-0 top-full bg-background border-b border-border/60 shadow-lg"
          >
            <ul className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-1">
              {navLinks.map((link) => renderNavLink(link, 'mobile'))}

              <li className="pt-2 mt-2 border-t border-border/60 flex flex-col gap-2">
                {!isLoading && !isAuthenticated && (
                  <>
                    <Link to="/register" onClick={() => setMenuOpen(false)}>
                      <span className="block text-center text-base font-medium px-5 py-3 rounded-full border border-foreground/20 text-foreground hover:bg-foreground/5 transition-colors cursor-pointer">
                        Register
                      </span>
                    </Link>
                    <Link to="/login" onClick={() => setMenuOpen(false)}>
                      <span className="block text-center text-base font-medium px-5 py-3 rounded-full border border-foreground/20 text-foreground hover:bg-foreground/5 transition-colors cursor-pointer">
                        Login
                      </span>
                    </Link>
                  </>
                )}
                {!isLoading && isAuthenticated && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full text-center text-base font-medium px-5 py-3 rounded-full border border-foreground/20 text-foreground hover:bg-foreground/5 transition-colors cursor-pointer"
                  >
                    Logout
                  </button>
                )}
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
