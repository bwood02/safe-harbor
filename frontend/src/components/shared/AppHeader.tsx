import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { logoutUser } from '@/lib/AuthApi';

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

  const roles = authSession.roles ?? [];
  const isAdmin = roles.includes('Admin');
  const isDonor = roles.includes('Donor');

  async function handleLogout() {
    try {
      await logoutUser();
      await refreshAuthState();
      navigate('/logout');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  const roleLinks: NavLinkItem[] = [];

  if (isAdmin) {
    roleLinks.push({ to: '/admin', label: 'Admin' });
  }

  if (isAdmin) {
    roleLinks.push(
      { to: '/caseload', label: 'Caseload' },
      { to: '/process-recordings', label: 'Process Recordings' },
      { to: '/visitation-logs', label: 'Visitation Logs' },
      { to: '/reports', label: 'Reports' }
    );
  }

  if (isAdmin) {
    roleLinks.push(
      { to: '/donors', label: 'Donor Contributions' },
      { to: '/social-media', label: 'Social Media' }
    );
  }

  if (isDonor) {
    roleLinks.push({ to: '/donor', label: 'My Dashboard' });
  }

  const navLinks = [...publicLinks, ...roleLinks];

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/60">
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-8">
        <Link to="/">
          <span className="font-serif italic font-medium text-foreground text-2xl tracking-wide cursor-pointer select-none">
            Safe Harbor
          </span>
        </Link>

        <nav aria-label="Main navigation" className="flex-1">
          <ul className="flex items-center justify-end gap-6 flex-wrap">
            {navLinks.map(({ to, label }) => {
              const isActive = pathname === to;

              return (
                <li key={to}>
                  <Link to={to}>
                    <span
                      className={`
                        text-lg font-medium cursor-pointer transition-colors relative py-1
                        ${
                          isActive
                            ? 'text-primary'
                            : 'text-foreground/70 hover:text-foreground'
                        }
                      `}
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
            })}

            {!isLoading && !isAuthenticated && (
              <>
                <li>
                  <Link to="/register">
                    <span className="text-base font-medium px-4 py-2 rounded-full border border-foreground/20 text-foreground hover:bg-foreground/5 transition-colors cursor-pointer">
                      Register
                    </span>
                  </Link>
                </li>
                <li>
                  <Link to="/login">
                    <span className="text-base font-medium px-4 py-2 rounded-full border border-foreground/20 text-foreground hover:bg-foreground/5 transition-colors cursor-pointer">
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
                  className="text-base font-medium px-4 py-2 rounded-full border border-foreground/20 text-foreground hover:bg-foreground/5 transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}