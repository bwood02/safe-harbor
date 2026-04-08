import { useMemo, useState } from 'react';
import StaffHeader from '@/components/shared/StaffHeader';
import PublicFooter from '@/components/shared/PublicFooter';
import {
  useSupporters,
  useSupporterDetail,
  useRecentDonations,
  useDonationsByProgramArea,
  type SupporterListItem,
} from '@/hooks/useDonors';

const PAGE_SIZE = 25;

function formatCurrency(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function DonorsContributionsPage() {
  const [type, setType] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const supporters = useSupporters({
    page,
    pageSize: PAGE_SIZE,
    type: type || undefined,
    status: status || undefined,
    search: search || undefined,
  });
  const detail = useSupporterDetail(selectedId);
  const recent = useRecentDonations(30);
  const programAreas = useDonationsByProgramArea();

  const kpis = useMemo(() => {
    const totalSupporters = supporters.data?.total ?? 0;
    const activeMonetary =
      supporters.data?.items.filter(
        (s) => s.status === 'Active' && s.donationCount > 0,
      ).length ?? 0;
    const last30 =
      recent.data?.reduce((sum, d) => sum + (d.estimatedValue ?? 0), 0) ?? 0;
    const topArea = programAreas.data?.[0]?.programArea ?? '—';
    return { totalSupporters, activeMonetary, last30, topArea };
  }, [supporters.data, recent.data, programAreas.data]);

  const totalPages = supporters.data
    ? Math.max(1, Math.ceil(supporters.data.total / PAGE_SIZE))
    : 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StaffHeader />
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12">
        <header className="mb-8">
          <h1 className="text-4xl font-serif text-foreground mb-2">
            Donors & Contributions
          </h1>
          <p className="text-muted-foreground">
            Review supporter relationships, recent gifts, and program-area
            allocations.
          </p>
        </header>

        {/* KPI cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard label="Total supporters" value={String(kpis.totalSupporters)} />
          <KpiCard
            label="Active monetary donors"
            value={String(kpis.activeMonetary)}
          />
          <KpiCard label="Last 30 days" value={formatCurrency(kpis.last30)} />
          <KpiCard label="Top program area" value={kpis.topArea} />
        </section>

        {/* Filters */}
        <section className="bg-card border border-border rounded-lg p-4 mb-6 flex flex-col md:flex-row gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search name or email"
            className="flex-1 px-3 py-2 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={type}
            onChange={(e) => {
              setPage(1);
              setType(e.target.value);
            }}
            className="px-3 py-2 rounded-md bg-background border border-border text-foreground"
          >
            <option value="">All types</option>
            <option value="Individual">Individual</option>
            <option value="Organization">Organization</option>
          </select>
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="px-3 py-2 rounded-md bg-background border border-border text-foreground"
          >
            <option value="">Any status</option>
            <option value="Active">Active</option>
            <option value="Lapsed">Lapsed</option>
            <option value="Inactive">Inactive</option>
          </select>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Supporter table */}
          <section className="lg:col-span-2 bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground uppercase text-xs tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Type</th>
                    <th className="text-left px-4 py-3">Region</th>
                    <th className="text-right px-4 py-3">Gifts</th>
                    <th className="text-right px-4 py-3">Total</th>
                    <th className="text-left px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {supporters.loading && !supporters.data && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        Loading supporters…
                      </td>
                    </tr>
                  )}
                  {supporters.data?.items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No supporters match your filters.
                      </td>
                    </tr>
                  )}
                  {supporters.data?.items.map((s: SupporterListItem) => {
                    const isSelected = s.supporterId === selectedId;
                    return (
                      <tr
                        key={s.supporterId}
                        onClick={() => setSelectedId(s.supporterId)}
                        className={`border-t border-border cursor-pointer hover:bg-muted/50 ${
                          isSelected ? 'bg-muted/70' : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-foreground font-medium">
                          {s.displayName}
                          <div className="text-xs text-muted-foreground">{s.email}</div>
                        </td>
                        <td className="px-4 py-3 text-foreground">{s.supporterType}</td>
                        <td className="px-4 py-3 text-foreground">
                          {s.region}
                          <div className="text-xs text-muted-foreground">{s.country}</div>
                        </td>
                        <td className="px-4 py-3 text-right text-foreground">
                          {s.donationCount}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground">
                          {formatCurrency(s.totalGiven)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs ${
                              s.status === 'Active'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm text-muted-foreground">
              <span>
                {supporters.data
                  ? `Page ${supporters.data.page} of ${totalPages} — ${supporters.data.total} total`
                  : '—'}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded border border-border disabled:opacity-40 hover:bg-muted"
                >
                  Prev
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded border border-border disabled:opacity-40 hover:bg-muted"
                >
                  Next
                </button>
              </div>
            </div>
            {supporters.error && (
              <div className="px-4 py-2 bg-muted text-xs text-muted-foreground">
                Backend unreachable — showing mock data. ({supporters.error})
              </div>
            )}
          </section>

          {/* Detail panel */}
          <aside className="bg-card border border-border rounded-lg p-5">
            <h2 className="font-serif text-xl text-foreground mb-3">
              Supporter detail
            </h2>
            {selectedId == null && (
              <p className="text-sm text-muted-foreground">
                Select a supporter to view their profile and donation history.
              </p>
            )}
            {selectedId != null && detail.loading && (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
            {detail.data && (
              <div className="space-y-4">
                <div>
                  <div className="text-foreground font-medium">
                    {detail.data.supporter.displayName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {detail.data.supporter.relationshipType} ·{' '}
                    {detail.data.supporter.supporterType}
                  </div>
                </div>
                <dl className="text-sm space-y-1">
                  <Row label="Email" value={detail.data.supporter.email} />
                  <Row label="Phone" value={detail.data.supporter.phone} />
                  <Row
                    label="Location"
                    value={`${detail.data.supporter.region}, ${detail.data.supporter.country}`}
                  />
                  <Row
                    label="First gift"
                    value={formatDate(detail.data.supporter.firstDonationDate)}
                  />
                  <Row
                    label="Channel"
                    value={detail.data.supporter.acquisitionChannel}
                  />
                </dl>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    Donation history ({detail.data.donations.length})
                  </h3>
                  <ul className="space-y-2 max-h-80 overflow-y-auto">
                    {detail.data.donations.length === 0 && (
                      <li className="text-sm text-muted-foreground">
                        No donations on record.
                      </li>
                    )}
                    {detail.data.donations.map((d) => (
                      <li
                        key={d.donationId}
                        className="border border-border rounded px-3 py-2 text-sm"
                      >
                        <div className="flex justify-between text-foreground">
                          <span>{d.donationType}</span>
                          <span>{formatCurrency(d.estimatedValue)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(d.donationDate)}
                          {d.campaignName ? ` · ${d.campaignName}` : ''}
                          {d.isRecurring ? ' · recurring' : ''}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* Program area breakdown */}
        <section className="mt-8 bg-card border border-border rounded-lg p-5">
          <h2 className="font-serif text-xl text-foreground mb-4">
            Allocations by program area
          </h2>
          <div className="space-y-2">
            {programAreas.data?.map((pa) => {
              const max = programAreas.data?.[0]?.total ?? 1;
              const pct = Math.round((pa.total / max) * 100);
              return (
                <div key={pa.programArea}>
                  <div className="flex justify-between text-sm text-foreground">
                    <span>{pa.programArea}</span>
                    <span>{formatCurrency(pa.total)}</span>
                  </div>
                  <div className="h-2 rounded bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-2xl font-serif text-foreground mt-1">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground text-right">{value}</dd>
    </div>
  );
}
