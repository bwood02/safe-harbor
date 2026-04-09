import { useMemo, useState } from 'react';
import StaffHeader from '@/components/shared/StaffHeader';
import PublicFooter from '@/components/shared/PublicFooter';
import {
  useAnnualAccomplishment,
  useDonationTrends,
  useDonationsByCampaign,
  useDonationsByType,
  useReintegrationOutcomes,
  useResidentOutcomes,
  useSafehouseComparison,
} from '@/hooks/useReports';
import type {
  DonationTrendPoint,
  ResidentOutcomePoint,
  SafehouseComparisonRow,
} from '@/types/reports';

type SortKey = keyof SafehouseComparisonRow;

function formatPhp(n: number): string {
  return `₱${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="bg-card border border-border rounded-lg p-6 mb-6">
      <div className="mb-4">
        <h2 className="text-xl font-serif text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function LineChart({ points }: { points: DonationTrendPoint[] }) {
  if (points.length === 0) return <p className="text-sm text-muted-foreground">No donation data in range.</p>;
  const w = 720;
  const h = 220;
  const pad = 32;
  const max = Math.max(...points.map((p) => p.totalPhp), 1);
  const step = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;
  const path = points
    .map((p, i) => {
      const x = pad + i * step;
      const y = h - pad - ((p.totalPhp / max) * (h - pad * 2));
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto min-w-[560px]">
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} className="stroke-border" strokeWidth={1} />
        <line x1={pad} y1={pad} x2={pad} y2={h - pad} className="stroke-border" strokeWidth={1} />
        <path d={path} fill="none" className="stroke-primary" strokeWidth={2} />
        {points.map((p, i) => {
          const x = pad + i * step;
          const y = h - pad - ((p.totalPhp / max) * (h - pad * 2));
          return <circle key={p.period} cx={x} cy={y} r={3} className="fill-primary" />;
        })}
        {points.map((p, i) => {
          if (points.length > 8 && i % 2 !== 0) return null;
          const x = pad + i * step;
          return (
            <text key={`lbl-${p.period}`} x={x} y={h - pad + 14} textAnchor="middle" className="fill-muted-foreground" fontSize="10">
              {p.period}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function HBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="mb-2">
      <div className="flex justify-between text-sm text-foreground mb-1">
        <span className="truncate mr-2">{label}</span>
        <span className="text-muted-foreground">{formatPhp(value)}</span>
      </div>
      <div className="w-full bg-muted h-2 rounded">
        <div className="h-2 bg-primary rounded" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function DualLineChart({ points }: { points: ResidentOutcomePoint[] }) {
  if (points.length === 0) return <p className="text-sm text-muted-foreground">No outcome data in range.</p>;
  const w = 720;
  const h = 220;
  const pad = 32;
  const eduMax = Math.max(...points.map((p) => p.avgEducationProgress), 1);
  const hwMax = Math.max(...points.map((p) => p.avgHealthScore), 1);
  const step = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;
  const eduPath = points
    .map((p, i) => {
      const x = pad + i * step;
      const y = h - pad - ((p.avgEducationProgress / eduMax) * (h - pad * 2));
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const hwPath = points
    .map((p, i) => {
      const x = pad + i * step;
      const y = h - pad - ((p.avgHealthScore / hwMax) * (h - pad * 2));
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto min-w-[560px]">
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} className="stroke-border" strokeWidth={1} />
        <path d={eduPath} fill="none" className="stroke-primary" strokeWidth={2} />
        <path d={hwPath} fill="none" stroke="currentColor" strokeWidth={2} strokeDasharray="4 4" opacity={0.6} />
        {points.map((p, i) => {
          const x = pad + i * step;
          return (
            <text key={p.period} x={x} y={h - pad + 14} textAnchor="middle" className="fill-muted-foreground" fontSize="10">
              {p.period}
            </text>
          );
        })}
      </svg>
      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-primary" /> Education progress</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-foreground/60" /> Health score</span>
      </div>
    </div>
  );
}

function Donut({ items }: { items: { key: string; count: number }[] }) {
  const total = items.reduce((a, b) => a + b.count, 0);
  if (total === 0) return <p className="text-sm text-muted-foreground">No data.</p>;
  const size = 140;
  const r = 56;
  const cx = size / 2;
  const cy = size / 2;
  const palette = ['#d97706', '#059669', '#2563eb', '#dc2626', '#7c3aed', '#0891b2'];
  let offset = 0;
  const segs = items.map((it, i) => {
    const frac = it.count / total;
    const start = offset * 2 * Math.PI - Math.PI / 2;
    const end = (offset + frac) * 2 * Math.PI - Math.PI / 2;
    offset += frac;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const large = frac > 0.5 ? 1 : 0;
    const path = `M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${large} 1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`;
    return { path, color: palette[i % palette.length], key: it.key, count: it.count };
  });
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segs.map((s) => (
          <path key={s.key} d={s.path} fill={s.color} />
        ))}
        <circle cx={cx} cy={cy} r={30} className="fill-card" />
      </svg>
      <ul className="text-sm space-y-1">
        {segs.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: s.color }} />
            <span className="text-foreground">{s.key}</span>
            <span className="text-muted-foreground">({s.count})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ReportsAnalyticsPage() {
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('safehouseName');
  const [sortAsc, setSortAsc] = useState(true);
  const [year, setYear] = useState<number>(new Date().getFullYear() - 1);

  const range = useMemo(
    () => ({ fromDate: fromDate || null, toDate: toDate || null }),
    [fromDate, toDate],
  );

  const trends = useDonationTrends(range, 'month');
  const campaigns = useDonationsByCampaign(range);
  const types = useDonationsByType(range);
  const outcomes = useResidentOutcomes(range);
  const safehouses = useSafehouseComparison(range);
  const reintegration = useReintegrationOutcomes();
  const annual = useAnnualAccomplishment(year);

  const sortedSafehouses = useMemo(() => {
    const rows = safehouses.data ?? [];
    const sorted = [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'number' && typeof bv === 'number') return sortAsc ? av - bv : bv - av;
      return sortAsc
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return sorted;
  }, [safehouses.data, sortKey, sortAsc]);

  const campaignMax = Math.max(...(campaigns.data ?? []).map((c) => c.totalPhp), 1);
  const typesMax = Math.max(...(types.data ?? []).map((t) => t.totalPhp), 1);

  function toggleSort(k: SortKey) {
    if (k === sortKey) setSortAsc((s) => !s);
    else {
      setSortKey(k);
      setSortAsc(true);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StaffHeader />
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 lg:py-16">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
            Internal Use Only
          </p>
          <h1 className="text-4xl lg:text-5xl font-serif text-foreground mb-4">
            Reports &amp; Analytics
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
            Aggregated insights across donations, resident outcomes, and safehouse performance.
          </p>
        </div>

        <Section title="Date range" subtitle="All sections below re-query when the range changes (blank = default trailing window).">
          <div className="flex flex-wrap gap-4 items-end">
            <label className="flex flex-col text-sm">
              <span className="text-muted-foreground mb-1">From</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="border border-border rounded px-3 py-2 bg-background text-foreground"
              />
            </label>
            <label className="flex flex-col text-sm">
              <span className="text-muted-foreground mb-1">To</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="border border-border rounded px-3 py-2 bg-background text-foreground"
              />
            </label>
            <button
              type="button"
              onClick={() => { setFromDate(''); setToDate(''); }}
              className="px-3 py-2 text-sm border border-border rounded text-foreground hover:bg-muted"
            >
              Reset
            </button>
          </div>
        </Section>

        <Section title="Donation trends" subtitle="Monthly total (PHP) across all donation types.">
          {trends.loading ? <p className="text-sm text-muted-foreground">Loading…</p> : <LineChart points={trends.data ?? []} />}
          {trends.error && <p className="text-xs text-muted-foreground mt-2">Using fallback data ({trends.error}).</p>}
        </Section>

        <Section title="Campaign comparison" subtitle="Total raised per campaign in PHP.">
          {campaigns.loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (campaigns.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No campaigns in range.</p>
          ) : (
            <div>
              {(campaigns.data ?? []).map((c) => (
                <HBar key={c.campaignName} label={`${c.campaignName} (${c.donorCount} donors)`} value={c.totalPhp} max={campaignMax} />
              ))}
            </div>
          )}
        </Section>

        <Section title="Donation types" subtitle="Breakdown by donation type (PHP).">
          {types.loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (types.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No donations in range.</p>
          ) : (
            <div>
              {(types.data ?? []).map((t) => (
                <HBar key={t.donationType} label={`${t.donationType} (${t.count})`} value={t.totalPhp} max={typesMax} />
              ))}
            </div>
          )}
        </Section>

        <Section title="Resident outcomes" subtitle="Monthly average education progress and health score.">
          {outcomes.loading ? <p className="text-sm text-muted-foreground">Loading…</p> : <DualLineChart points={outcomes.data ?? []} />}
        </Section>

        <Section title="Safehouse comparison" subtitle="Click a column header to sort.">
          {safehouses.loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse min-w-[720px]">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    {([
                      ['safehouseName', 'Safehouse'],
                      ['activeResidents', 'Active'],
                      ['avgEducationProgress', 'Avg Edu %'],
                      ['avgHealthScore', 'Avg Health'],
                      ['incidentCount', 'Incidents'],
                      ['processRecordingCount', 'Sessions'],
                      ['homeVisitCount', 'Visits'],
                    ] as [SortKey, string][]).map(([k, label]) => (
                      <th
                        key={k}
                        className="py-2 pr-3 cursor-pointer select-none"
                        onClick={() => toggleSort(k)}
                      >
                        {label}{sortKey === k ? (sortAsc ? ' ▲' : ' ▼') : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedSafehouses.map((r) => (
                    <tr key={r.safehouseId} className="border-b border-border/50">
                      <td className="py-2 pr-3 text-foreground">{r.safehouseName}</td>
                      <td className="py-2 pr-3">{r.activeResidents}</td>
                      <td className="py-2 pr-3">{r.avgEducationProgress}</td>
                      <td className="py-2 pr-3">{r.avgHealthScore}</td>
                      <td className="py-2 pr-3">{r.incidentCount}</td>
                      <td className="py-2 pr-3">{r.processRecordingCount}</td>
                      <td className="py-2 pr-3">{r.homeVisitCount}</td>
                    </tr>
                  ))}
                  {sortedSafehouses.length === 0 && (
                    <tr><td colSpan={7} className="py-4 text-muted-foreground">No safehouses found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <Section title="Reintegration outcomes" subtitle={`Completion rate: ${reintegration.data?.completionRatePercent ?? 0}%`}>
          {reintegration.loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">By status</h3>
                <Donut items={reintegration.data?.statusBreakdown ?? []} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">By type</h3>
                <Donut items={reintegration.data?.typeBreakdown ?? []} />
              </div>
            </div>
          )}
        </Section>

        <Section title="Annual Accomplishment Report" subtitle="Aligned with the Philippine DSWD Annual Accomplishment Report format.">
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm text-muted-foreground">Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value) || year)}
              className="border border-border rounded px-3 py-1 w-24 bg-background text-foreground"
            />
          </div>
          {annual.loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : annual.data ? (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="border border-border rounded p-4">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Caring</p>
                  <p className="text-3xl font-serif text-foreground">{annual.data.servicesProvided.caring}</p>
                  <p className="text-xs text-muted-foreground">interventions logged</p>
                </div>
                <div className="border border-border rounded p-4">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Healing</p>
                  <p className="text-3xl font-serif text-foreground">{annual.data.servicesProvided.healing}</p>
                  <p className="text-xs text-muted-foreground">health &amp; psychosocial services</p>
                </div>
                <div className="border border-border rounded p-4">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Teaching</p>
                  <p className="text-3xl font-serif text-foreground">{annual.data.servicesProvided.teaching}</p>
                  <p className="text-xs text-muted-foreground">education interventions</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="border border-border rounded p-4">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Beneficiaries</p>
                  <p className="text-sm text-foreground">Total served: <span className="font-semibold">{annual.data.beneficiaries.totalServed}</span></p>
                  <p className="text-sm text-foreground">Active at year end: <span className="font-semibold">{annual.data.beneficiaries.activeAtYearEnd}</span></p>
                </div>
                <div className="border border-border rounded p-4">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Outcomes</p>
                  <p className="text-sm text-foreground">Reintegrations completed: <span className="font-semibold">{annual.data.outcomes.reintegrationsCompleted}</span></p>
                  <p className="text-sm text-foreground">Education completions: <span className="font-semibold">{annual.data.outcomes.educationCompletions}</span></p>
                  <p className="text-sm text-foreground">Avg health improvement: <span className="font-semibold">{annual.data.outcomes.avgHealthImprovement.toFixed(2)}</span></p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No data for {year}.</p>
          )}
        </Section>
      </main>
      <PublicFooter />
    </div>
  );
}
