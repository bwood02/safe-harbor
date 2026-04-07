import StaffHeader from '@/components/shared/StaffHeader';
import PublicFooter from '@/components/shared/PublicFooter';
import StatusBadge from '@/components/shared/StatusBadge';
import { useResidents } from '@/hooks/useMockData';
import { Search, Filter, MapPin, Tag } from 'lucide-react';

export default function CaseloadInventoryPage() {
  const residentsQuery = useResidents();
  const mockResidents = residentsQuery.data ?? [];
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StaffHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 lg:py-16">
        {/* Title */}
        <div className="mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
            Internal Use Only
          </p>
          <h1 className="text-4xl lg:text-5xl font-serif text-foreground mb-6">Caseload Inventory</h1>
          <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
            Active resident management system. Each record captures demographics, case category, 
            admission details, assigned social worker, and reintegration tracking milestones.
          </p>
        </div>

        {/* Filter Bar */}
        <section
          className="bg-white rounded-2xl p-4 border border-border shadow-sm mb-8"
          aria-label="Filter records"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div
              className="flex-1 w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-background border border-border text-muted-foreground"
              role="search"
            >
              <Search className="w-5 h-5 opacity-50" />
              <span className="text-base select-none">Search by name or ID...</span>
            </div>
            
            <div className="w-full md:w-auto flex gap-4">
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-background border border-border text-foreground font-medium select-none min-w-[160px]">
                <Filter className="w-4 h-4 text-primary" />
                All Statuses
              </div>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-background border border-border text-foreground font-medium select-none min-w-[160px]">
                <MapPin className="w-4 h-4 text-primary" />
                All Locations
              </div>
              <div className="hidden lg:flex items-center gap-2 px-4 py-3 rounded-xl bg-background border border-border text-foreground font-medium select-none min-w-[160px]">
                <Tag className="w-4 h-4 text-primary" />
                All Categories
              </div>
            </div>
          </div>
        </section>

        {/* Residents Table */}
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left" aria-label="Resident caseload table">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  {[
                    'Resident',
                    'Category',
                    'Location',
                    'Social Worker',
                    'Status',
                    ''
                  ].map((col, i) => (
                    <th
                      key={col}
                      scope="col"
                      className={`px-6 py-5 text-xs font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap ${i === 5 ? 'text-right' : ''}`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mockResidents.map((resident) => (
                  <tr
                    key={resident.id}
                    className="hover:bg-background/80 transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <div>
                        <p className="text-base font-medium text-foreground">{resident.name}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{resident.id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-base text-foreground">{resident.category}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{resident.subCategory}</p>
                    </td>
                    <td className="px-6 py-5 text-base text-foreground whitespace-nowrap">
                      {resident.safehouse}
                    </td>
                    <td className="px-6 py-5 text-base text-foreground whitespace-nowrap">
                      {resident.socialWorker}
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge status={resident.status} />
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 px-5 py-2 rounded-full border border-primary text-primary text-sm font-medium hover:bg-primary hover:text-white transition-all"
                        aria-label={`Edit record for ${resident.name}`}
                      >
                        Review Case
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
