import { useEffect, useMemo, useState, type ReactNode } from 'react';
import StaffHeader from '@/components/shared/StaffHeader';
import PublicFooter from '@/components/shared/PublicFooter';
import {
  useSupporters,
  useSupporterDetail,
  useRecentDonations,
  useDonationsByProgramArea,
  type SupporterListItem,
  type DonationRecord,
} from '@/hooks/useDonors';
import { X, Plus, Pencil } from 'lucide-react';
import { apiPost, apiPut } from '@/lib/api';
import type {
  CreateSupporterRequestDto,
  SupporterDto,
  UpdateSupporterRequestDto,
} from '@/types/supporters';

const PAGE_SIZE = 25;
type DonationType = 'Monetary' | 'InKind' | 'Time' | 'Skills' | 'SocialMedia';
type ChannelSource = 'Campaign' | 'Event' | 'Direct' | 'SocialMedia' | 'PartnerReferral';
type ImpactUnit = 'pesos' | 'items' | 'hours' | 'campaigns';
type ItemCategory =
  | 'Food'
  | 'Supplies'
  | 'Clothing'
  | 'SchoolMaterials'
  | 'Hygiene'
  | 'Furniture'
  | 'Medical';
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

const SUPPORTER_TYPE_OPTIONS = [
  'MonetaryDonor',
  'InKindDonor',
  'Volunteer',
  'SkillsContributor',
  'SocialMediaAdvocate',
  'PartnerOrganization',
] as const;
const RELATIONSHIP_TYPE_OPTIONS = ['Local', 'International', 'PartnerOrganization'] as const;
const ACQUISITION_CHANNEL_OPTIONS = [
  'Website',
  'SocialMedia',
  'Event',
  'WordOfMouth',
  'PartnerReferral',
  'Church',
] as const;
const STATUS_OPTIONS = ['Active', 'Inactive'] as const;
const CURRENCY_OPTIONS: Array<{ code: CurrencyCode; symbol: string }> = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: 'EUR' },
  { code: 'GBP', symbol: 'GBP' },
  { code: 'JPY', symbol: 'JPY' },
  { code: 'CAD', symbol: 'CAD' },
  { code: 'AUD', symbol: 'AUD' },
  { code: 'CHF', symbol: 'CHF' },
  { code: 'CNY', symbol: 'CNY' },
  { code: 'HKD', symbol: 'HKD' },
  { code: 'SGD', symbol: 'SGD' },
  { code: 'INR', symbol: 'INR' },
  { code: 'KRW', symbol: 'KRW' },
  { code: 'MXN', symbol: 'MXN' },
  { code: 'BRL', symbol: 'BRL' },
  { code: 'ZAR', symbol: 'ZAR' },
  { code: 'PHP', symbol: 'PHP' },
];
const ALLOCATION_AREAS: AllocationArea[] = [
  'Education',
  'Wellbeing',
  'Operations',
  'Transport',
  'Maintenance',
  'Outreach',
];

interface SupporterFormState {
  supporterType: (typeof SUPPORTER_TYPE_OPTIONS)[number];
  displayName: string;
  organizationName: string;
  firstName: string;
  lastName: string;
  relationshipType: (typeof RELATIONSHIP_TYPE_OPTIONS)[number];
  region: string;
  country: string;
  email: string;
  phone: string;
  status: (typeof STATUS_OPTIONS)[number];
  firstDonationDate: string;
  acquisitionChannel: (typeof ACQUISITION_CHANNEL_OPTIONS)[number];
  createdAt: string;
}

interface DonationFormState {
  donationId: number;
  supporterId: number;
  donationType: DonationType;
  donationDate: string;
  channelSource: ChannelSource | null;
  currencyCode: CurrencyCode | null;
  amount: number | null;
  estimatedValue: number | null;
  impactUnit: ImpactUnit;
  isRecurring: boolean;
  campaignName: string;
  notes: string;
  allocationArea: AllocationArea;
  itemName: string;
  itemCategory: ItemCategory | null;
  quantity: number | null;
  unitOfMeasure: UnitOfMeasure | null;
  estimatedUnitValue: number | null;
  intendedUse: IntendedUse | null;
  receivedCondition: ReceivedCondition | null;
}

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
  const [expandedDonationId, setExpandedDonationId] = useState<number | null>(null);

  const [isCreateSupporterOpen, setIsCreateSupporterOpen] = useState(false);
  const [isEditSupporterOpen, setIsEditSupporterOpen] = useState(false);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [donationModalMode, setDonationModalMode] = useState<'create' | 'edit'>('create');

  const [localDonations, setLocalDonations] = useState<
    NonNullable<ReturnType<typeof useSupporterDetail>['data']>['donations']
  >([]);
  const [supporterForm, setSupporterForm] = useState<SupporterFormState>({
    supporterType: 'MonetaryDonor',
    displayName: '',
    organizationName: '',
    firstName: '',
    lastName: '',
    relationshipType: 'Local',
    region: '',
    country: '',
    email: '',
    phone: '',
    status: 'Active',
    firstDonationDate: '',
    acquisitionChannel: 'Website',
    createdAt: '',
  });
  const [donationForm, setDonationForm] = useState<DonationFormState>({
    donationId: 0,
    supporterId: 0,
    donationType: 'Monetary',
    donationDate: '',
    channelSource: null,
    currencyCode: 'PHP',
    amount: null,
    estimatedValue: null,
    impactUnit: 'pesos',
    isRecurring: false,
    campaignName: '',
    notes: '',
    allocationArea: 'Education',
    itemName: '',
    itemCategory: null,
    quantity: null,
    unitOfMeasure: null,
    estimatedUnitValue: null,
    intendedUse: null,
    receivedCondition: null,
  });
  const [donationFormError, setDonationFormError] = useState<string | null>(null);
  const [supporterFormError, setSupporterFormError] = useState<string | null>(null);
  const [isSubmittingSupporter, setIsSubmittingSupporter] = useState(false);
  const [supporterOverrides, setSupporterOverrides] = useState<Record<number, SupporterDto>>({});

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
  const selectedSupporter = useMemo(() => {
    if (!detail.data?.supporter) return null;
    const base = detail.data.supporter;
    return supporterOverrides[base.supporterId] ?? base;
  }, [detail.data?.supporter, supporterOverrides]);

  useEffect(() => {
    if (detail.data?.donations) {
      setLocalDonations(detail.data.donations);
      setExpandedDonationId(null);
    } else {
      setLocalDonations([]);
      setExpandedDonationId(null);
    }
  }, [detail.data]);

  function openCreateSupporterModal() {
    setSupporterForm({
      supporterType: 'MonetaryDonor',
      displayName: '',
      organizationName: '',
      firstName: '',
      lastName: '',
      relationshipType: 'Local',
      region: '',
      country: '',
      email: '',
      phone: '',
      status: 'Active',
      firstDonationDate: '',
      acquisitionChannel: 'Website',
      createdAt: new Date().toISOString().slice(0, 16),
    });
    setSupporterFormError(null);
    setIsCreateSupporterOpen(true);
  }

  function openEditSupporterModal() {
    if (!selectedSupporter) return;
    const s = selectedSupporter;
    setSupporterForm({
      supporterType: SUPPORTER_TYPE_OPTIONS.includes(
        s.supporterType as (typeof SUPPORTER_TYPE_OPTIONS)[number],
      )
        ? (s.supporterType as (typeof SUPPORTER_TYPE_OPTIONS)[number])
        : 'MonetaryDonor',
      displayName: s.displayName ?? '',
      organizationName: s.organizationName ?? '',
      firstName: s.firstName ?? '',
      lastName: s.lastName ?? '',
      relationshipType: RELATIONSHIP_TYPE_OPTIONS.includes(
        s.relationshipType as (typeof RELATIONSHIP_TYPE_OPTIONS)[number],
      )
        ? (s.relationshipType as (typeof RELATIONSHIP_TYPE_OPTIONS)[number])
        : 'Local',
      region: s.region ?? '',
      country: s.country ?? '',
      email: s.email ?? '',
      phone: s.phone ?? '',
      status: STATUS_OPTIONS.includes(s.status as (typeof STATUS_OPTIONS)[number])
        ? (s.status as (typeof STATUS_OPTIONS)[number])
        : 'Active',
      firstDonationDate: s.firstDonationDate?.slice(0, 10) ?? '',
      acquisitionChannel: ACQUISITION_CHANNEL_OPTIONS.includes(
        s.acquisitionChannel as (typeof ACQUISITION_CHANNEL_OPTIONS)[number],
      )
        ? (s.acquisitionChannel as (typeof ACQUISITION_CHANNEL_OPTIONS)[number])
        : 'Website',
      createdAt: s.createdAt?.slice(0, 16) ?? '',
    });
    setSupporterFormError(null);
    setIsEditSupporterOpen(true);
  }

  function openCreateDonationModal() {
    if (selectedId == null) return;
    setDonationModalMode('create');
    setDonationForm({
      donationId: 0,
      supporterId: selectedId,
      donationType: 'Monetary',
      donationDate: '',
      channelSource: null,
      currencyCode: 'PHP',
      amount: null,
      estimatedValue: null,
      impactUnit: 'pesos',
      isRecurring: false,
      campaignName: '',
      notes: '',
      allocationArea: 'Education',
      itemName: '',
      itemCategory: null,
      quantity: null,
      unitOfMeasure: null,
      estimatedUnitValue: null,
      intendedUse: null,
      receivedCondition: null,
    });
    setDonationFormError(null);
    setIsDonationModalOpen(true);
  }

  function openEditDonationModal(donationId: number) {
    const d = localDonations.find((x) => x.donationId === donationId);
    if (!d) return;
    setDonationModalMode('edit');
    setDonationForm({
      donationId: d.donationId,
      supporterId: d.supporterId,
      donationType: (d.donationType as DonationType) ?? 'Monetary',
      donationDate: d.donationDate ? d.donationDate.slice(0, 10) : '',
      channelSource: (d.channelSource as ChannelSource | null) ?? null,
      currencyCode: (d.currencyCode as CurrencyCode | null) ?? 'PHP',
      amount: d.amount,
      estimatedValue: d.estimatedValue ?? null,
      impactUnit: (d.impactUnit as ImpactUnit) ?? 'pesos',
      isRecurring: d.isRecurring,
      campaignName: d.campaignName ?? '',
      notes: d.notes ?? '',
      allocationArea: 'Education',
      itemName: '',
      itemCategory: null,
      quantity: null,
      unitOfMeasure: null,
      estimatedUnitValue: null,
      intendedUse: null,
      receivedCondition: null,
    });
    setDonationFormError(null);
    setIsDonationModalOpen(true);
  }

  function submitDonationForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!donationForm.donationDate) {
      setDonationFormError('Donation date is required.');
      return;
    }
    if (donationForm.donationType === 'Monetary' && (donationForm.amount == null || donationForm.amount <= 0)) {
      setDonationFormError('Amount is required for monetary donations.');
      return;
    }
    if (
      donationForm.donationType !== 'Monetary' &&
      (donationForm.estimatedValue == null || Number.isNaN(donationForm.estimatedValue))
    ) {
      setDonationFormError('Estimated value is required for non-monetary donations.');
      return;
    }
    if (donationForm.donationType === 'InKind') {
      if (
        !donationForm.itemName.trim() ||
        !donationForm.itemCategory ||
        donationForm.quantity == null ||
        donationForm.quantity <= 0 ||
        !donationForm.unitOfMeasure ||
        donationForm.estimatedUnitValue == null ||
        donationForm.estimatedUnitValue < 0 ||
        !donationForm.intendedUse ||
        !donationForm.receivedCondition
      ) {
        setDonationFormError('All InKind item fields are required.');
        return;
      }
    }

    const nextRecord: DonationRecord = {
      donationId:
        donationModalMode === 'create'
          ? Math.max(0, ...localDonations.map((x) => x.donationId)) + 1
          : donationForm.donationId,
      supporterId: donationForm.supporterId,
      donationType: donationForm.donationType,
      donationDate: donationForm.donationDate,
      isRecurring: donationForm.isRecurring,
      campaignName: donationForm.campaignName || null,
      channelSource: donationForm.channelSource,
      currencyCode: donationForm.donationType === 'Monetary' ? donationForm.currencyCode : null,
      amount: donationForm.donationType === 'Monetary' ? donationForm.amount : null,
      estimatedValue:
        donationForm.donationType === 'Monetary'
          ? donationForm.amount ?? 0
          : donationForm.estimatedValue ?? 0,
      impactUnit: donationForm.impactUnit,
      notes: donationForm.notes || null,
    };

    setLocalDonations((prev) =>
      donationModalMode === 'create'
        ? [nextRecord, ...prev]
        : prev.map((d) => (d.donationId === nextRecord.donationId ? nextRecord : d)),
    );
    setDonationFormError(null);
    setIsDonationModalOpen(false);
  }

  async function submitSupporterForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSupporterFormError(null);

    const payload: CreateSupporterRequestDto = {
      supporterType: supporterForm.supporterType,
      displayName: supporterForm.displayName.trim(),
      organizationName: supporterForm.organizationName.trim() || null,
      firstName: supporterForm.firstName.trim() || null,
      lastName: supporterForm.lastName.trim() || null,
      relationshipType: supporterForm.relationshipType,
      region: supporterForm.region.trim(),
      country: supporterForm.country.trim(),
      email: supporterForm.email.trim(),
      phone: supporterForm.phone.trim(),
      status: supporterForm.status,
      firstDonationDate: supporterForm.firstDonationDate || null,
      acquisitionChannel: supporterForm.acquisitionChannel,
    };

    setIsSubmittingSupporter(true);
    const res =
      isEditSupporterOpen && selectedId != null
        ? await apiPut<UpdateSupporterRequestDto, SupporterDto>(
            `/api/Supporters/${selectedId}`,
            payload,
          )
        : await apiPost<CreateSupporterRequestDto, SupporterDto>(
            '/api/Supporters',
            payload,
          );
    setIsSubmittingSupporter(false);

    if (!res.data) {
      setSupporterFormError(
        res.error ??
          (isEditSupporterOpen
            ? 'Failed to update supporter.'
            : 'Failed to create supporter.'),
      );
      return;
    }
    const savedSupporter = res.data;

    if (isEditSupporterOpen && selectedId != null) {
      setSupporterOverrides((prev) => ({ ...prev, [selectedId]: savedSupporter }));
      setIsEditSupporterOpen(false);
      setIsCreateSupporterOpen(false);
      return;
    }

    setSupporterOverrides((prev) => ({ ...prev, [savedSupporter.supporterId]: savedSupporter }));
    setSelectedId(savedSupporter.supporterId);
    setIsCreateSupporterOpen(false);
    setIsEditSupporterOpen(false);
  }

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

        {/* Filters + create supporter */}
        <section className="bg-card border border-border rounded-lg p-4 mb-6 flex flex-col gap-4">
          <div className="flex justify-end">
            <button
              onClick={openCreateSupporterModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Supporter
            </button>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
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
          </div>
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
                    const o = supporterOverrides[s.supporterId];
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
                          {o?.displayName ?? s.displayName}
                          <div className="text-xs text-muted-foreground">{o?.email ?? s.email}</div>
                        </td>
                        <td className="px-4 py-3 text-foreground">{o?.supporterType ?? s.supporterType}</td>
                        <td className="px-4 py-3 text-foreground">
                          {o?.region ?? s.region}
                          <div className="text-xs text-muted-foreground">{o?.country ?? s.country}</div>
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
                            {o?.status ?? s.status}
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
            {detail.data && selectedSupporter && (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-foreground font-medium">
                      {selectedSupporter.displayName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedSupporter.relationshipType} ·{' '}
                      {selectedSupporter.supporterType}
                    </div>
                  </div>
                  <button
                    onClick={openEditSupporterModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary text-primary text-xs font-medium hover:bg-primary hover:text-white transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit Supporter Details
                  </button>
                </div>
                <dl className="text-sm space-y-1">
                  <Row label="Email" value={selectedSupporter.email} />
                  <Row label="Phone" value={selectedSupporter.phone} />
                  <Row
                    label="Location"
                    value={`${selectedSupporter.region}, ${selectedSupporter.country}`}
                  />
                  <Row
                    label="Status"
                    value={selectedSupporter.status}
                  />
                  <Row
                    label="Acquisition"
                    value={selectedSupporter.acquisitionChannel}
                  />
                  <Row
                    label="Created"
                    value={formatDate(selectedSupporter.createdAt)}
                  />
                  <Row
                    label="First gift"
                    value={formatDate(selectedSupporter.firstDonationDate)}
                  />
                </dl>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      Donation history ({localDonations.length})
                    </h3>
                    <button
                      onClick={openCreateDonationModal}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary text-primary text-xs font-medium hover:bg-primary hover:text-white transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add donation
                    </button>
                  </div>
                  <ul className="space-y-2 max-h-80 overflow-y-auto">
                    {localDonations.length === 0 && (
                      <li className="text-sm text-muted-foreground">
                        No donations on record.
                      </li>
                    )}
                    {localDonations.map((d) => {
                      const expanded = expandedDonationId === d.donationId;
                      return (
                        <li
                          key={d.donationId}
                          className="border border-border rounded px-3 py-2 text-sm"
                        >
                          <div className="flex items-start gap-2">
                            <button
                              onClick={() =>
                                setExpandedDonationId((prev) =>
                                  prev === d.donationId ? null : d.donationId,
                                )
                              }
                              className="w-full text-left"
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
                            </button>
                            <button
                              onClick={() => openEditDonationModal(d.donationId)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-primary text-primary text-xs font-medium hover:bg-primary hover:text-white transition-colors shrink-0"
                            >
                              <Pencil className="w-3 h-3" />
                              Edit
                            </button>
                          </div>

                          {expanded && (
                            <div className="mt-3 pt-3 border-t border-border space-y-2">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <MiniRow label="Donation ID" value={String(d.donationId)} />
                                <MiniRow label="Supporter ID" value={String(d.supporterId)} />
                                <MiniRow label="Type" value={d.donationType} />
                                <MiniRow label="Date" value={formatDate(d.donationDate)} />
                                <MiniRow label="Channel" value={d.channelSource || '—'} />
                                <MiniRow label="Currency" value={d.currencyCode || '—'} />
                                <MiniRow
                                  label="Amount"
                                  value={d.amount != null ? formatCurrency(d.amount) : '—'}
                                />
                                <MiniRow label="Impact Unit" value={d.impactUnit || '—'} />
                              </div>
                              <div className="text-xs">
                                <div className="text-muted-foreground">Notes</div>
                                <div className="text-foreground">{d.notes || '—'}</div>
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <div className="text-xs text-muted-foreground">
                    Frontend-only editing UI for now.
                  </div>
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

      {(isCreateSupporterOpen || isEditSupporterOpen) && (
        <div className="fixed inset-0 z-50 bg-foreground/35 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90svh] overflow-y-auto rounded-3xl border border-border bg-white shadow-xl">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-2xl font-serif text-foreground">
                {isCreateSupporterOpen ? 'Create Supporter' : 'Edit Supporter Details'}
              </h3>
              <button
                onClick={() => {
                  setIsCreateSupporterOpen(false);
                  setIsEditSupporterOpen(false);
                }}
                className="p-2 rounded-full border border-border hover:bg-background"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={submitSupporterForm} className="p-6 grid sm:grid-cols-2 gap-4">
              <Field label="Supporter Type *">
                <select
                  required
                  value={supporterForm.supporterType}
                  onChange={(e) =>
                    setSupporterForm((p) => ({
                      ...p,
                      supporterType: e.target.value as SupporterFormState['supporterType'],
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                >
                  {SUPPORTER_TYPE_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </Field>
              <Field label="Display Name *">
                <input
                  required
                  value={supporterForm.displayName}
                  onChange={(e) =>
                    setSupporterForm((p) => ({ ...p, displayName: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                />
              </Field>
              <Field label="Organization Name">
                <input
                  required={supporterForm.supporterType === 'PartnerOrganization'}
                  value={supporterForm.organizationName}
                  onChange={(e) =>
                    setSupporterForm((p) => ({ ...p, organizationName: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                />
              </Field>
              <Field label="First Name">
                <input
                  required={supporterForm.supporterType !== 'PartnerOrganization'}
                  value={supporterForm.firstName}
                  onChange={(e) =>
                    setSupporterForm((p) => ({ ...p, firstName: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                />
              </Field>
              <Field label="Last Name">
                <input
                  required={supporterForm.supporterType !== 'PartnerOrganization'}
                  value={supporterForm.lastName}
                  onChange={(e) =>
                    setSupporterForm((p) => ({ ...p, lastName: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                />
              </Field>
              <Field label="Relationship Type *">
                <select
                  required
                  value={supporterForm.relationshipType}
                  onChange={(e) =>
                    setSupporterForm((p) => ({
                      ...p,
                      relationshipType: e.target.value as SupporterFormState['relationshipType'],
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                >
                  {RELATIONSHIP_TYPE_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </Field>
              <Field label="Region *">
                <input
                  required
                  value={supporterForm.region}
                  onChange={(e) => setSupporterForm((p) => ({ ...p, region: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                />
              </Field>
              <Field label="Country *">
                <input
                  required
                  value={supporterForm.country}
                  onChange={(e) => setSupporterForm((p) => ({ ...p, country: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                />
              </Field>
              <Field label="Email *">
                <input
                  required
                  type="email"
                  value={supporterForm.email}
                  onChange={(e) => setSupporterForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                />
              </Field>
              <Field label="Phone *">
                <input
                  required
                  value={supporterForm.phone}
                  onChange={(e) => setSupporterForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                />
              </Field>
              <Field label="Status *">
                <select
                  required
                  value={supporterForm.status}
                  onChange={(e) =>
                    setSupporterForm((p) => ({
                      ...p,
                      status: e.target.value as SupporterFormState['status'],
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </Field>
              <Field label="First Donation Date">
                <input
                  type="date"
                  value={supporterForm.firstDonationDate}
                  onChange={(e) =>
                    setSupporterForm((p) => ({ ...p, firstDonationDate: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                />
              </Field>
              <Field label="Acquisition Channel *">
                <select
                  required
                  value={supporterForm.acquisitionChannel}
                  onChange={(e) =>
                    setSupporterForm((p) => ({
                      ...p,
                      acquisitionChannel:
                        e.target.value as SupporterFormState['acquisitionChannel'],
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                >
                  {ACQUISITION_CHANNEL_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </Field>
              <Field label="Created At *">
                <input
                  type="datetime-local"
                  required
                  value={supporterForm.createdAt}
                  onChange={(e) =>
                    setSupporterForm((p) => ({ ...p, createdAt: e.target.value }))
                  }
                  readOnly={isCreateSupporterOpen}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                />
              </Field>
              {supporterFormError && (
                <p className="sm:col-span-2 text-sm font-medium text-destructive">
                  {supporterFormError}
                </p>
              )}
              <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateSupporterOpen(false);
                    setIsEditSupporterOpen(false);
                    setSupporterFormError(null);
                  }}
                  className="px-5 py-2.5 rounded-full border border-border text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSupporter}
                  className="px-5 py-2.5 rounded-full bg-primary text-white disabled:opacity-60"
                >
                  {isSubmittingSupporter
                    ? 'Saving...'
                    : isCreateSupporterOpen
                      ? 'Create Supporter'
                      : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDonationModalOpen && (
        <div className="fixed inset-0 z-50 bg-foreground/35 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90svh] overflow-y-auto rounded-3xl border border-border bg-white shadow-xl">
            <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between">
              <h3 className="text-2xl font-serif text-foreground">
                {donationModalMode === 'create' ? 'Add Donation' : 'Edit Donation'}
              </h3>
              <button
                onClick={() => setIsDonationModalOpen(false)}
                className="p-2 rounded-full border border-border hover:bg-background"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submitDonationForm} className="p-6 grid sm:grid-cols-2 gap-4">
              <input type="hidden" value={donationForm.supporterId} />

              <Field label="Donation Type *">
                <select
                  value={donationForm.donationType}
                  onChange={(e) =>
                    setDonationForm((prev) => {
                      const nextType = e.target.value as DonationType;
                      return {
                        ...prev,
                        donationType: nextType,
                        itemName: nextType === 'InKind' ? prev.itemName : '',
                        itemCategory: nextType === 'InKind' ? (prev.itemCategory ?? 'Food') : null,
                        quantity: nextType === 'InKind' ? prev.quantity : null,
                        unitOfMeasure:
                          nextType === 'InKind' ? (prev.unitOfMeasure ?? 'pcs') : null,
                        estimatedUnitValue:
                          nextType === 'InKind' ? prev.estimatedUnitValue : null,
                        intendedUse:
                          nextType === 'InKind' ? (prev.intendedUse ?? 'Meals') : null,
                        receivedCondition:
                          nextType === 'InKind'
                            ? (prev.receivedCondition ?? 'New')
                            : null,
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
              </Field>
              <Field label="Donation Date *">
                <input
                  type="date"
                  required
                  value={donationForm.donationDate}
                  onChange={(e) =>
                    setDonationForm((p) => ({ ...p, donationDate: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                />
              </Field>

              <Field label="Channel Source">
                <select
                  value={donationForm.channelSource ?? ''}
                  onChange={(e) =>
                    setDonationForm((p) => ({
                      ...p,
                      channelSource: e.target.value
                        ? (e.target.value as ChannelSource)
                        : null,
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
              </Field>

              {donationForm.donationType === 'Monetary' && (
                <Field label="Currency Code">
                  <select
                    value={donationForm.currencyCode ?? ''}
                    onChange={(e) =>
                      setDonationForm((prev) => ({
                        ...prev,
                        currencyCode: e.target.value
                          ? (e.target.value as CurrencyCode)
                          : null,
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
                </Field>
              )}

              {donationForm.donationType === 'Monetary' && (
                <Field label="Amount *">
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={donationForm.amount ?? ''}
                    onChange={(e) =>
                      setDonationForm((prev) => ({
                        ...prev,
                        amount: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  />
                </Field>
              )}

              {donationForm.donationType !== 'Monetary' && (
                <Field label="Estimated Value *">
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={donationForm.estimatedValue ?? ''}
                    onChange={(e) =>
                      setDonationForm((prev) => ({
                        ...prev,
                        estimatedValue: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  />
                </Field>
              )}

              {donationForm.donationType === 'InKind' && (
                <>
                  <Field label="Item Name *">
                    <input
                      type="text"
                      required
                      value={donationForm.itemName}
                      onChange={(e) =>
                        setDonationForm((prev) => ({ ...prev, itemName: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                    />
                  </Field>
                  <Field label="Item Category *">
                    <select
                      required
                      value={donationForm.itemCategory ?? 'Food'}
                      onChange={(e) =>
                        setDonationForm((prev) => ({
                          ...prev,
                          itemCategory: e.target.value as ItemCategory,
                        }))
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
                  </Field>
                  <Field label="Quantity *">
                    <input
                      type="number"
                      min={1}
                      required
                      value={donationForm.quantity ?? ''}
                      onChange={(e) =>
                        setDonationForm((prev) => ({
                          ...prev,
                          quantity: e.target.value ? Number(e.target.value) : null,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                    />
                  </Field>
                  <Field label="Unit of Measure *">
                    <select
                      required
                      value={donationForm.unitOfMeasure ?? 'pcs'}
                      onChange={(e) =>
                        setDonationForm((prev) => ({
                          ...prev,
                          unitOfMeasure: e.target.value as UnitOfMeasure,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                    >
                      <option>pcs</option>
                      <option>boxes</option>
                      <option>kg</option>
                      <option>sets</option>
                      <option>packs</option>
                    </select>
                  </Field>
                  <Field label="Estimated Unit Value (PHP) *">
                    <input
                      type="number"
                      required
                      min={0}
                      step="0.01"
                      value={donationForm.estimatedUnitValue ?? ''}
                      onChange={(e) =>
                        setDonationForm((prev) => ({
                          ...prev,
                          estimatedUnitValue: e.target.value
                            ? Number(e.target.value)
                            : null,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                    />
                  </Field>
                  <Field label="Intended Use *">
                    <select
                      required
                      value={donationForm.intendedUse ?? 'Meals'}
                      onChange={(e) =>
                        setDonationForm((prev) => ({
                          ...prev,
                          intendedUse: e.target.value as IntendedUse,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                    >
                      <option>Meals</option>
                      <option>Education</option>
                      <option>Shelter</option>
                      <option>Hygiene</option>
                      <option>Health</option>
                    </select>
                  </Field>
                  <Field label="Received Condition *">
                    <select
                      required
                      value={donationForm.receivedCondition ?? 'New'}
                      onChange={(e) =>
                        setDonationForm((prev) => ({
                          ...prev,
                          receivedCondition: e.target.value as ReceivedCondition,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                    >
                      <option>New</option>
                      <option>Good</option>
                      <option>Fair</option>
                    </select>
                  </Field>
                </>
              )}

              <Field label="Impact Unit *">
                <select
                  required
                  value={donationForm.impactUnit}
                  onChange={(e) =>
                    setDonationForm((p) => ({ ...p, impactUnit: e.target.value as ImpactUnit }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                >
                  <option>pesos</option>
                  <option>items</option>
                  <option>hours</option>
                  <option>campaigns</option>
                </select>
              </Field>
              <Field label="Recurring *">
                <select
                  required
                  value={donationForm.isRecurring ? 'true' : 'false'}
                  onChange={(e) =>
                    setDonationForm((p) => ({ ...p, isRecurring: e.target.value === 'true' }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </Field>
              <Field label="Campaign Name">
                <input
                  value={donationForm.campaignName}
                  onChange={(e) =>
                    setDonationForm((p) => ({ ...p, campaignName: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                />
              </Field>
              <Field label="Allocation Area *">
                <select
                  required
                  value={donationForm.allocationArea}
                  onChange={(e) =>
                    setDonationForm((p) => ({
                      ...p,
                      allocationArea: e.target.value as AllocationArea,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                >
                  {ALLOCATION_AREAS.map((area) => (
                    <option key={area}>{area}</option>
                  ))}
                </select>
              </Field>
              <Field label="Notes" className="sm:col-span-2">
                <textarea
                  rows={3}
                  value={donationForm.notes}
                  onChange={(e) => setDonationForm((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                />
              </Field>
              {donationFormError && (
                <p className="sm:col-span-2 text-sm font-medium text-destructive">
                  {donationFormError}
                </p>
              )}
              <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDonationModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-border text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-primary text-white"
                >
                  {donationModalMode === 'create' ? 'Add Donation' : 'Save Donation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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

function MiniRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="text-foreground font-medium">{value}</div>
    </div>
  );
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`space-y-2 ${className}`}>
      <span className="text-sm font-semibold text-foreground">{label}</span>
      {children}
    </label>
  );
}
