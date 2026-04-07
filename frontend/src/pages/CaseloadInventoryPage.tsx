import { Link } from 'react-router-dom'
import { StaffHeader } from '../components/layout/StaffHeader'
import { StatusBadge } from '../components/wireframe/StatusBadge'
import { mockCaseloadRows } from '../data/mockResidents'

function FakeInput({ label, placeholder, wide }: { label: string; placeholder: string; wide?: boolean }) {
  return (
    <div className={wide ? 'min-w-[200px] flex-1' : 'min-w-[140px]'}>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-sh-subtle">{label}</p>
      <div
        className="flex items-center gap-2 rounded-md border border-sh-mist-deep/60 bg-sh-surface px-3 py-2"
        aria-hidden
      >
        {wide ? (
          <>
            <div className="h-3 w-3 rounded-sm border border-sh-accent/40 bg-sh-mist" />
            <span className="text-xs text-sh-subtle">{placeholder}</span>
          </>
        ) : (
          <span className="text-xs font-semibold text-sh-ink">{placeholder}</span>
        )}
      </div>
    </div>
  )
}

export function CaseloadInventoryPage() {
  return (
    <div className="wireframe-static min-h-screen bg-sh-canvas text-sh-ink">
      <StaffHeader />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-black uppercase tracking-tight text-sh-deep">Caseload Inventory</h1>
        <p className="mt-2 max-w-4xl text-xs font-semibold uppercase leading-relaxed text-sh-muted">
          Active resident management system • internal use only
        </p>
        <p className="mt-3 max-w-4xl text-xs leading-relaxed text-sh-muted">
          Resident records follow Philippine social welfare case structure — demographics; case category and
          sub-categories (e.g., trafficked, physical abuse, neglect); disability information; family socio-demographic
          markers (4Ps, solo parent, indigenous peoples, informal settler); admission and referral details; assigned social
          workers; and reintegration tracking. Full CRUD screens are represented here by the inventory table only.
        </p>

        <section className="mt-8 rounded-xl border border-sh-mist-deep/50 bg-sh-mist/60 p-4" aria-label="Filters (static)">
          <div className="flex flex-wrap items-end gap-4">
            <FakeInput label="Search records" placeholder="Name or case ID..." wide />
            <FakeInput label="Status" placeholder="All statuses" />
            <FakeInput label="Safehouse" placeholder="All locations" />
            <FakeInput label="Category" placeholder="All categories" />
            <button
              type="button"
              className="ml-auto rounded-md bg-sh-deep px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white"
              aria-disabled
            >
              Apply filters
            </button>
          </div>
        </section>

        <section className="mt-6 overflow-x-auto rounded-xl border border-sh-mist-deep/50 bg-sh-surface shadow-sm" aria-label="Resident inventory">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-sh-mist text-[10px] font-black uppercase tracking-wide text-sh-deep">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Sub-category</th>
                <th className="px-4 py-3">Safehouse</th>
                <th className="px-4 py-3">Social worker</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockCaseloadRows.map((row) => (
                <tr key={row.id} className="border-t border-sh-mist-deep/40">
                  <td className="px-4 py-3 text-xs font-semibold text-sh-ink">{row.name}</td>
                  <td className="px-4 py-3 text-xs text-sh-muted">{row.category}</td>
                  <td className="px-4 py-3 text-xs text-sh-muted">{row.subCategory}</td>
                  <td className="px-4 py-3 text-xs text-sh-muted">{row.safehouse}</td>
                  <td className="px-4 py-3 text-xs text-sh-muted">{row.socialWorker}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-md border border-sh-mist-deep bg-sh-mist px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-sh-deep">
                      Edit
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>

      <footer className="mt-12 border-t border-sh-mist-deep/40 bg-sh-mist/50">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-[11px] uppercase">
          <Link to="/caseload" className="font-black tracking-tight text-sh-deep hover:text-sh-primary">
            Safe Harbor
          </Link>
          <p className="text-sh-muted">© 2026 Safe Harbor management system. All rights reserved.</p>
          <div className="flex gap-4 font-semibold text-sh-muted">
            <span>Privacy policy</span>
            <span>Terms of service</span>
            <span>Contact</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
