import { useEffect, useMemo, useState } from 'react';
import { Search, Filter, Repeat, HandCoins, X } from 'lucide-react';
import AppHeader from '@/components/shared/AppHeader';
import PublicFooter from '@/components/shared/PublicFooter';
import { apiGet, apiPost } from '@/lib/api';
import type {
  CreateDonationRequestDto,
  DonorDashboardDonationDto,
  GetDonationsResponseDto,
} from '@/types/donorDashboard';

type DonationType = 'Monetary' | 'InKind' | 'Time' | 'Skills' | 'SocialMedia';
type ChannelSource = 'Campaign' | 'Event' | 'Direct' | 'SocialMedia' | 'PartnerReferral';
type ImpactUnit = 'pesos' | 'items' | 'hours' | 'campaigns';
type ItemCategory = 'Food' | 'Supplies' | 'Clothing' | 'SchoolMaterials' | 'Hygiene' | 'Furniture' | 'Medical';
type UnitOfMeasure = 'pcs' | 'boxes' | 'kg' | 'sets' | 'packs';
type IntendedUse = 'Meals' | 'Education' | 'Shelter' | 'Hygiene' | 'Health';
type ReceivedCondition = 'New' | 'Good' | 'Fair';
type CurrencyCode =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'JPY'
  | 'CAD'
  | 'AUD'
  | 'CHF'
  | 'CNY'
  | 'HKD'
  | 'SGD'
  | 'INR'
  | 'KRW'
  | 'MXN'
  | 'BRL'
  | 'ZAR'
  | 'PHP';
type AllocationArea =
  | 'Education'
  | 'Wellbeing'
  | 'Operations'
  | 'Transport'
  | 'Maintenance'
  | 'Outreach';

/** Shown in the table/snapshot; donors do not set allocation — staff adds rows later. */
type DisplayAllocationArea = AllocationArea | 'Unallocated';

interface DonationRow {
  donation_id: number;
  supporter_id: number;
  donation_type: DonationType;
  donation_date: string;
  channel_source: ChannelSource | null;
  currency_code: CurrencyCode | null;
  amount: number | null;
  estimated_value: number | null;
  impact_unit: ImpactUnit;
  is_recurring: boolean;
  campaign_name: string | null;
  notes: string | null;
  allocation_area: DisplayAllocationArea;
  item_name: string | null;
  item_category: ItemCategory | null;
  quantity: number | null;
  unit_of_measure: UnitOfMeasure | null;
  estimated_unit_value: number | null;
  intended_use: IntendedUse | null;
  received_condition: ReceivedCondition | null;
}

const ALLOCATION_AREAS: AllocationArea[] = [
  'Education',
  'Wellbeing',
  'Operations',
  'Transport',
  'Maintenance',
  'Outreach',
];

const SNAPSHOT_AREAS: DisplayAllocationArea[] = [...ALLOCATION_AREAS, 'Unallocated'];

const CURRENCY_OPTIONS: Array<{ code: CurrencyCode; symbol: string }> = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'JPY', symbol: '¥' },
  { code: 'CAD', symbol: 'C$' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'CHF', symbol: 'CHF' },
  { code: 'CNY', symbol: 'CN¥' },
  { code: 'HKD', symbol: 'HK$' },
  { code: 'SGD', symbol: 'S$' },
  { code: 'INR', symbol: '₹' },
  { code: 'KRW', symbol: '₩' },
  { code: 'MXN', symbol: 'MX$' },
  { code: 'BRL', symbol: 'R$' },
  { code: 'ZAR', symbol: 'R' },
  { code: 'PHP', symbol: '₱' },
];

function formatAmount(donation: DonationRow): string {
  if (donation.currency_code && donation.amount != null) {
    const symbol = CURRENCY_OPTIONS.find((c) => c.code === donation.currency_code)?.symbol ?? donation.currency_code;
    return `${symbol} ${donation.amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  if (donation.estimated_value != null) {
    return `${donation.estimated_value.toLocaleString()} ${donation.impact_unit}`;
  }
  return '—';
}

function emptyDonationForm(): DonationRow {
  return {
    donation_id: 0,
    supporter_id: 0,
    donation_type: 'Monetary',
    donation_date: '',
    channel_source: null,
    currency_code: 'PHP',
    amount: null,
    estimated_value: null,
    impact_unit: 'pesos',
    is_recurring: false,
    campaign_name: null,
    notes: null,
    allocation_area: 'Unallocated',
    item_name: null,
    item_category: null,
    quantity: null,
    unit_of_measure: null,
    estimated_unit_value: null,
    intended_use: null,
    received_condition: null,
  };
}

function mapDonationDtoToRow(d: DonorDashboardDonationDto): DonationRow {
  const firstAllocation = d.donationAllocations[0]?.programArea as AllocationArea | undefined;
  const firstItem = d.inKindDonationItems[0];
  const resolvedAllocation: DisplayAllocationArea =
    !d.donationAllocations?.length
      ? 'Unallocated'
      : firstAllocation && ALLOCATION_AREAS.includes(firstAllocation)
        ? firstAllocation
        : 'Unallocated';
  return {
    donation_id: d.donationId,
    supporter_id: d.supporterId,
    donation_type: d.donationType as DonationType,
    donation_date: d.donationDate ?? '',
    channel_source: (d.channelSource as ChannelSource | null) ?? null,
    currency_code: (d.currencyCode as CurrencyCode | null) ?? null,
    amount: d.amount,
    estimated_value: d.estimatedValue,
    impact_unit: d.impactUnit as ImpactUnit,
    is_recurring: d.isRecurring,
    campaign_name: d.campaignName,
    notes: d.notes,
    allocation_area: resolvedAllocation,
    item_name: firstItem?.itemName ?? null,
    item_category: (firstItem?.itemCategory as ItemCategory) ?? null,
    quantity: firstItem?.quantity ?? null,
    unit_of_measure: (firstItem?.unitOfMeasure as UnitOfMeasure) ?? null,
    estimated_unit_value: firstItem?.estimatedUnitValue ?? null,
    intended_use: (firstItem?.intendedUse as IntendedUse) ?? null,
    received_condition: (firstItem?.receivedCondition as ReceivedCondition) ?? null,
  };
}

export default function DonorDashboardPage() {
  const [donations, setDonations] = useState<DonationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | DonationType>('All');
  const [recurringFilter, setRecurringFilter] = useState<'All' | 'Recurring' | 'One-time'>('All');
  const [allocationFilter, setAllocationFilter] = useState<'All' | DisplayAllocationArea>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<DonationRow | null>(null);
  const [form, setForm] = useState<DonationRow>(emptyDonationForm());
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDonations() {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await apiGet<GetDonationsResponseDto>(
          '/api/DonorDashboard/GetDonations',
        );
        if (cancelled) return;
        if (!response.data) {
          setDonations([]);
          const message = response.error ?? 'Failed to load donor donations.';
          setLoadError(
            message.toLowerCase().includes('donor-supporter link')
              ? 'Your donor profile is not linked yet. Please contact support to finish account setup.'
              : message,
          );
          return;
        }
        const data = response.data;

        const rows: DonationRow[] = data.map(mapDonationDtoToRow);

        setDonations(rows);
      } catch (err) {
        if (cancelled) return;
        setLoadError((err as Error).message || 'Failed to load donor donations.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDonations();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredDonations = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return donations.filter((d) => {
      const matchesSearch =
        needle.length === 0 ||
        d.donation_id.toString().includes(needle) ||
        d.donation_type.toLowerCase().includes(needle) ||
        (d.campaign_name ?? '').toLowerCase().includes(needle);
      const matchesType = typeFilter === 'All' || d.donation_type === typeFilter;
      const matchesRecurring =
        recurringFilter === 'All' ||
        (recurringFilter === 'Recurring' ? d.is_recurring : !d.is_recurring);
      const matchesAllocation = allocationFilter === 'All' || d.allocation_area === allocationFilter;
      return matchesSearch && matchesType && matchesRecurring && matchesAllocation;
    });
  }, [donations, search, typeFilter, recurringFilter, allocationFilter]);

  const allocationPercentages = useMemo(() => {
    const total = donations.length;
    return SNAPSHOT_AREAS.map((area) => {
      const count = donations.filter((d) => d.allocation_area === area).length;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return { area, pct, count };
    });
  }, [donations]);

  function openModal() {
    setForm(emptyDonationForm());
    setFormError(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setFormError(null);
  }

  function submitNewDonation(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.donation_date) {
      setFormError('Donation date is required.');
      return;
    }

    if (form.donation_type === 'InKind') {
      if (form.estimated_value == null || Number.isNaN(form.estimated_value)) {
        setFormError('Estimated value is required for non-monetary donations.');
        return;
      }
      if (
        !form.item_name?.trim() ||
        !form.item_category ||
        form.quantity == null ||
        form.quantity <= 0 ||
        !form.unit_of_measure ||
        form.estimated_unit_value == null ||
        form.estimated_unit_value < 0 ||
        !form.intended_use ||
        !form.received_condition
      ) {
        setFormError('All InKind item fields are required.');
        return;
      }
    }

    const requestBody: CreateDonationRequestDto = {
      donationType: form.donation_type,
      donationDate: form.donation_date || null,
      isRecurring: form.is_recurring,
      campaignName: form.campaign_name?.trim() || null,
      channelSource: form.channel_source || null,
      currencyCode: form.donation_type === 'Monetary' ? form.currency_code : null,
      amount: form.donation_type === 'Monetary' ? form.amount : null,
      estimatedValue:
        form.donation_type === 'Monetary'
          ? form.amount ?? 0
          : form.estimated_value ?? 0,
      impactUnit: form.impact_unit,
      notes: form.notes?.trim() || null,
      referralPostId: null,
      donationAllocations: [],
      inKindDonationItems:
        form.donation_type === 'InKind'
          ? [
              {
                itemName: form.item_name?.trim() ?? '',
                itemCategory: form.item_category ?? '',
                quantity: form.quantity ?? 0,
                unitOfMeasure: form.unit_of_measure ?? '',
                estimatedUnitValue: form.estimated_unit_value ?? 0,
                intendedUse: form.intended_use ?? '',
                receivedCondition: form.received_condition ?? '',
              },
            ]
          : [],
    };

    void (async () => {
      const res = await apiPost<CreateDonationRequestDto, DonorDashboardDonationDto>(
        '/api/DonorDashboard/CreateDonation',
        requestBody,
      );

      if (!res.data) {
        const message = res.error ?? 'Failed to create donation.';
        if (message.toLowerCase().includes('donor-supporter link')) {
          setFormError('Your donor profile is not linked yet. Please contact support to finish account setup.');
          return;
        }
        setFormError(message);
        return;
      }
      const created = res.data;

      setDonations((prev) => [mapDonationDtoToRow(created), ...prev]);
      closeModal();
    })();
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 lg:py-16">
        <div className="mb-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
              Donor Portal
            </p>
            <h1 className="text-4xl lg:text-5xl font-serif text-foreground mb-4">My Donations</h1>
            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
              Track your contributions. Program allocation is set by staff after your gift is recorded.
            </p>
          </div>
          <button
            onClick={openModal}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-white text-base font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <HandCoins className="w-4 h-4" />
            New Donation
          </button>
        </div>

        {loadError && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 mb-6">
            <p className="text-sm font-medium text-destructive">{loadError}</p>
          </div>
        )}

        <section className="rounded-2xl border border-border bg-white shadow-sm p-5 md:p-6 mb-8">
          <h2 className="text-xl font-serif text-foreground mb-1">Allocation Snapshot</h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-3xl">
            Donations you submit appear as &quot;Unallocated&quot; until staff assign them to program areas.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allocationPercentages.map(({ area, pct, count }) => (
              <article key={area} className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{area}</p>
                  <p className="text-lg font-serif text-primary">{pct}%</p>
                </div>
                <div className="h-2 rounded-full bg-border overflow-hidden" aria-hidden="true">
                  <div className="h-full rounded-full bg-primary/80" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{count} donation(s)</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl p-4 border border-border shadow-sm mb-8" aria-label="Filter donations">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <label className="flex-1 w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-background border border-border text-muted-foreground">
              <Search className="w-5 h-5 opacity-50" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by donation ID, type, or campaign..."
                className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              />
            </label>

            <div className="w-full md:w-auto grid sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 px-4 py-3 rounded-xl bg-background border border-border text-foreground font-medium min-w-[180px]">
                <Filter className="w-4 h-4 text-primary" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as 'All' | DonationType)}
                  className="bg-transparent outline-none w-full"
                >
                  <option>All</option>
                  <option>Monetary</option>
                  <option>InKind</option>
                  <option>Time</option>
                  <option>Skills</option>
                  <option>SocialMedia</option>
                </select>
              </label>

              <label className="flex items-center gap-2 px-4 py-3 rounded-xl bg-background border border-border text-foreground font-medium min-w-[180px]">
                <Repeat className="w-4 h-4 text-primary" />
                <select
                  value={recurringFilter}
                  onChange={(e) => setRecurringFilter(e.target.value as 'All' | 'Recurring' | 'One-time')}
                  className="bg-transparent outline-none w-full"
                >
                  <option>All</option>
                  <option>Recurring</option>
                  <option>One-time</option>
                </select>
              </label>

              <label className="flex items-center gap-2 px-4 py-3 rounded-xl bg-background border border-border text-foreground font-medium min-w-[180px]">
                <HandCoins className="w-4 h-4 text-primary" />
                <select
                  value={allocationFilter}
                  onChange={(e) =>
                    setAllocationFilter(e.target.value as 'All' | DisplayAllocationArea)
                  }
                  className="bg-transparent outline-none w-full"
                >
                  <option>All</option>
                  {ALLOCATION_AREAS.map((area) => (
                    <option key={area}>{area}</option>
                  ))}
                  <option>Unallocated</option>
                </select>
              </label>
            </div>
          </div>
        </section>

        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left" aria-label="Donor donations table">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  {[
                    'Donation ID',
                    'Type',
                    'Date',
                    'Currency / Amount',
                    'Recurring',
                    'Notes',
                    'Allocation',
                  ].map((col) => (
                    <th
                      key={col}
                      scope="col"
                      className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      Loading donations...
                    </td>
                  </tr>
                )}
                {!loading && filteredDonations.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      No donations found for this donor.
                    </td>
                  </tr>
                )}
                {filteredDonations.map((donation) => (
                  <tr
                    key={donation.donation_id}
                    className="hover:bg-background/80 transition-colors cursor-pointer"
                    onClick={() => setSelectedDonation(donation)}
                  >
                    <td className="px-6 py-5 text-base font-medium text-foreground">
                      {donation.donation_id}
                    </td>
                    <td className="px-6 py-5 text-base text-foreground">{donation.donation_type}</td>
                    <td className="px-6 py-5 text-base text-foreground whitespace-nowrap">
                      {donation.donation_date || '—'}
                    </td>
                    <td className="px-6 py-5 text-base text-foreground whitespace-nowrap">
                      {formatAmount(donation)}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                          donation.is_recurring
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-background text-muted-foreground border-border'
                        }`}
                      >
                        {donation.is_recurring ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {donation.notes ? (
                        <div className="relative group inline-block">
                          <span className="text-sm font-medium text-primary border border-primary/20 bg-primary/10 rounded-full px-3 py-1 cursor-help">
                            Has notes
                          </span>
                          <div className="absolute left-0 top-full mt-2 w-64 rounded-xl bg-foreground text-white text-sm p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {donation.notes}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-base text-foreground whitespace-nowrap">
                      {donation.allocation_area}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-foreground/35 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90svh] overflow-y-auto rounded-3xl border border-border bg-white shadow-xl">
            <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-serif text-foreground">New Donation</h2>
              <button
                onClick={closeModal}
                className="p-2 rounded-full border border-border hover:bg-background transition-colors"
                aria-label="Close donation modal"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>

            <form onSubmit={submitNewDonation} className="p-6 grid sm:grid-cols-2 gap-4">
              <input type="hidden" value={form.supporter_id} />

              <label className="space-y-2">
                <span className="text-sm font-semibold text-foreground">Donation Type *</span>
                <select
                  value={form.donation_type}
                  onChange={(e) =>
                    setForm((prev) => {
                      const nextType = e.target.value as DonationType;
                      return {
                        ...prev,
                        donation_type: nextType,
                        item_name: nextType === 'InKind' ? prev.item_name : null,
                        item_category: nextType === 'InKind' ? (prev.item_category ?? 'Food') : null,
                        quantity: nextType === 'InKind' ? prev.quantity : null,
                        unit_of_measure: nextType === 'InKind' ? (prev.unit_of_measure ?? 'pcs') : null,
                        estimated_unit_value: nextType === 'InKind' ? prev.estimated_unit_value : null,
                        intended_use: nextType === 'InKind' ? (prev.intended_use ?? 'Meals') : null,
                        received_condition: nextType === 'InKind' ? (prev.received_condition ?? 'New') : null,
                      };
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                >
                  <option>Monetary</option>
                  <option>InKind</option>
                  <option>Time</option>
                  <option>Skills</option>
                  <option>SocialMedia</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-foreground">Donation Date *</span>
                <input
                  type="date"
                  required
                  value={form.donation_date}
                  onChange={(e) => setForm((prev) => ({ ...prev, donation_date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-foreground">Channel Source</span>
                <select
                  value={form.channel_source ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      channel_source: e.target.value ? (e.target.value as ChannelSource) : null,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                >
                  <option value="">None</option>
                  <option>Campaign</option>
                  <option>Event</option>
                  <option>Direct</option>
                  <option>SocialMedia</option>
                  <option>PartnerReferral</option>
                </select>
              </label>

              {form.donation_type === 'Monetary' && (
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-foreground">Currency Code</span>
                  <select
                    value={form.currency_code ?? ''}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        currency_code: e.target.value ? (e.target.value as CurrencyCode) : null,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  >
                    <option value="">None</option>
                    {CURRENCY_OPTIONS.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {form.donation_type === 'Monetary' && (
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-foreground">Amount *</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.amount ?? ''}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, amount: e.target.value ? Number(e.target.value) : null }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  />
                </label>
              )}

              {form.donation_type !== 'Monetary' && (
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-foreground">Estimated Value *</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.estimated_value ?? ''}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        estimated_value: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  />
                </label>
              )}

              {form.donation_type === 'InKind' && (
                <>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-foreground">Item Name *</span>
                    <input
                      type="text"
                      required
                      value={form.item_name ?? ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, item_name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-foreground">Item Category *</span>
                    <select
                      required
                      value={form.item_category ?? 'Food'}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, item_category: e.target.value as ItemCategory }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                    >
                      <option>Food</option>
                      <option>Supplies</option>
                      <option>Clothing</option>
                      <option>SchoolMaterials</option>
                      <option>Hygiene</option>
                      <option>Furniture</option>
                      <option>Medical</option>
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-foreground">Quantity *</span>
                    <input
                      type="number"
                      required
                      min={1}
                      value={form.quantity ?? ''}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, quantity: e.target.value ? Number(e.target.value) : null }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-foreground">Unit of Measure *</span>
                    <select
                      required
                      value={form.unit_of_measure ?? 'pcs'}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, unit_of_measure: e.target.value as UnitOfMeasure }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                    >
                      <option>pcs</option>
                      <option>boxes</option>
                      <option>kg</option>
                      <option>sets</option>
                      <option>packs</option>
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-foreground">Estimated Unit Value (PHP) *</span>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min={0}
                      value={form.estimated_unit_value ?? ''}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          estimated_unit_value: e.target.value ? Number(e.target.value) : null,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-foreground">Intended Use *</span>
                    <select
                      required
                      value={form.intended_use ?? 'Meals'}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, intended_use: e.target.value as IntendedUse }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                    >
                      <option>Meals</option>
                      <option>Education</option>
                      <option>Shelter</option>
                      <option>Hygiene</option>
                      <option>Health</option>
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-foreground">Received Condition *</span>
                    <select
                      required
                      value={form.received_condition ?? 'New'}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          received_condition: e.target.value as ReceivedCondition,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                    >
                      <option>New</option>
                      <option>Good</option>
                      <option>Fair</option>
                    </select>
                  </label>
                </>
              )}

              <label className="space-y-2">
                <span className="text-sm font-semibold text-foreground">Impact Unit *</span>
                <select
                  required
                  value={form.impact_unit}
                  onChange={(e) => setForm((prev) => ({ ...prev, impact_unit: e.target.value as ImpactUnit }))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                >
                  <option>pesos</option>
                  <option>items</option>
                  <option>hours</option>
                  <option>campaigns</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-foreground">Recurring *</span>
                <select
                  required
                  value={form.is_recurring ? 'true' : 'false'}
                  onChange={(e) => setForm((prev) => ({ ...prev, is_recurring: e.target.value === 'true' }))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-foreground">Campaign Name</span>
                <input
                  type="text"
                  value={form.campaign_name ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, campaign_name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                />
              </label>

              <p className="sm:col-span-2 text-sm text-muted-foreground rounded-xl border border-border bg-background px-3 py-2">
                Program allocation is handled by Safe Harbor staff after your donation is received. You do
                not need to choose a program area here.
              </p>

              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-semibold text-foreground">Notes</span>
                <textarea
                  rows={3}
                  value={form.notes ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                />
              </label>

              {formError && (
                <p className="sm:col-span-2 text-sm font-medium text-destructive">{formError}</p>
              )}

              <div className="sm:col-span-2 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-full border border-border text-foreground font-medium hover:bg-background transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
                >
                  Make Donation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedDonation && (
        <div className="fixed inset-0 z-50 bg-foreground/35 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90svh] overflow-y-auto rounded-3xl border border-border bg-white shadow-xl">
            <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-serif text-foreground">
                Donation #{selectedDonation.donation_id}
              </h2>
              <button
                onClick={() => setSelectedDonation(null)}
                className="p-2 rounded-full border border-border hover:bg-background transition-colors"
                aria-label="Close donation details modal"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>

            <div className="p-6 grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Donation ID</p>
                <p className="text-base text-foreground font-medium">{selectedDonation.donation_id}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Supporter ID</p>
                <p className="text-base text-foreground font-medium">{selectedDonation.supporter_id}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Donation Type</p>
                <p className="text-base text-foreground font-medium">{selectedDonation.donation_type}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Donation Date</p>
                <p className="text-base text-foreground font-medium">{selectedDonation.donation_date || '—'}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Channel Source</p>
                <p className="text-base text-foreground font-medium">{selectedDonation.channel_source}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Currency Code</p>
                <p className="text-base text-foreground font-medium">{selectedDonation.currency_code ?? 'null'}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Amount</p>
                <p className="text-base text-foreground font-medium">
                  {selectedDonation.amount != null ? selectedDonation.amount : 'null'}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Estimated Value</p>
                <p className="text-base text-foreground font-medium">{selectedDonation.estimated_value}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Impact Unit</p>
                <p className="text-base text-foreground font-medium">{selectedDonation.impact_unit}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Is Recurring</p>
                <p className="text-base text-foreground font-medium">{selectedDonation.is_recurring ? 'true' : 'false'}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Campaign Name</p>
                <p className="text-base text-foreground font-medium">{selectedDonation.campaign_name ?? 'null'}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Allocation Area</p>
                <p className="text-base text-foreground font-medium">{selectedDonation.allocation_area}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3 sm:col-span-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Notes</p>
                <p className="text-base text-foreground font-medium whitespace-pre-wrap">{selectedDonation.notes ?? 'null'}</p>
              </div>

              {selectedDonation.donation_type === 'InKind' && (
                <>
                  <div className="rounded-xl border border-border bg-background p-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Item Name</p>
                    <p className="text-base text-foreground font-medium">{selectedDonation.item_name}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Item Category</p>
                    <p className="text-base text-foreground font-medium">{selectedDonation.item_category}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Quantity</p>
                    <p className="text-base text-foreground font-medium">{selectedDonation.quantity}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Unit of Measure</p>
                    <p className="text-base text-foreground font-medium">{selectedDonation.unit_of_measure}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Estimated Unit Value (PHP)</p>
                    <p className="text-base text-foreground font-medium">{selectedDonation.estimated_unit_value}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Intended Use</p>
                    <p className="text-base text-foreground font-medium">{selectedDonation.intended_use}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Received Condition</p>
                    <p className="text-base text-foreground font-medium">{selectedDonation.received_condition}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  );
}

