import { NavLink } from 'react-router-dom'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-xs font-semibold uppercase tracking-wide border-b-2 pb-1 transition-colors ${
    isActive ? 'border-sh-primary text-sh-primary' : 'border-transparent text-sh-muted hover:text-sh-ink'
  }`

const SAFE_EXIT_HREF = 'https://www.google.com'

export function PublicHeader() {
  return (
    <header className="border-b border-sh-mist-deep/60 bg-sh-surface/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <NavLink
          to="/impact"
          className="text-lg font-black uppercase tracking-tight text-sh-deep transition-colors hover:text-sh-primary"
        >
          Safe Harbor
        </NavLink>
        <nav className="flex flex-1 justify-center gap-6 md:gap-8" aria-label="Primary">
          <NavLink to="/mission" className={navLinkClass}>
            Our Mission
          </NavLink>
          <NavLink to="/impact" end={false} className={navLinkClass}>
            Impact Data
          </NavLink>
          <NavLink to="/support" className={navLinkClass}>
            Support Services
          </NavLink>
          <NavLink to="/transparency" className={navLinkClass}>
            Transparency
          </NavLink>
        </nav>
        <a
          href={SAFE_EXIT_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-sh-deep px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-sh-primary"
        >
          Safe Exit
        </a>
      </div>
    </header>
  )
}
