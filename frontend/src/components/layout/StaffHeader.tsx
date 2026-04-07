import { NavLink } from 'react-router-dom'
import { UserAvatar } from '../wireframe/UserAvatar'

const staffNavLink = ({ isActive }: { isActive: boolean }) =>
  `text-[11px] font-bold uppercase tracking-wide border-b-[3px] pb-2 transition-colors ${
    isActive ? 'border-sh-primary text-sh-deep' : 'border-transparent text-sh-muted hover:text-sh-ink'
  }`

export function StaffHeader() {
  return (
    <header className="border-b border-sh-mist-deep/60 bg-sh-surface/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <NavLink
          to="/admin"
          className="text-base font-black uppercase tracking-tight text-sh-deep transition-colors hover:text-sh-primary"
        >
          Safe Harbor
        </NavLink>
        <nav className="flex flex-1 justify-center gap-8 md:gap-10" aria-label="Staff primary">
          <NavLink to="/impact" className={staffNavLink}>
            Impact Dashboard
          </NavLink>
          <NavLink to="/admin" className={staffNavLink} end>
            Admin Dashboard
          </NavLink>
          <NavLink to="/caseload" className={staffNavLink}>
            Caseload Inventory
          </NavLink>
        </nav>
        <UserAvatar />
      </div>
    </header>
  )
}
