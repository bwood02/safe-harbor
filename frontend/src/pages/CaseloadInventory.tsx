import { useMemo, useState } from 'react';
import StaffHeader from '@/components/shared/StaffHeader';
import PublicFooter from '@/components/shared/PublicFooter';
import MlResidentWellbeingPanel from '@/components/ml/MlResidentWellbeingPanel';
import MlEarlyWarningPanel from '@/components/ml/MlEarlyWarningPanel';
import MlReintegrationReadinessPanel from '@/components/ml/MlReintegrationReadinessPanel';
import { Search, Filter, MapPin, Tag, AlertTriangle, X } from 'lucide-react';
import {
  useCaseloadList,
  useCaseloadDetail,
  useSafehouses,
  useCaseloadFilters,
  useCaseloadMutations,
} from '@/hooks/useCaseload';
import type {
  CaseloadFilters,
  ResidentDetail,
  ResidentInput,
} from '@/types/caseload';

const EMPTY_INPUT: ResidentInput = {
  caseControlNo: '',
  internalCode: 0,
  safehouseId: 0,
  caseStatus: 'Active',
  sex: 'F',
  dateOfBirth: '2015-01-01',
  birthStatus: '',
  placeOfBirth: '',
  religion: '',
  caseCategory: '',
  subCatOrphaned: false,
  subCatTrafficked: false,
  subCatChildLabor: false,
  subCatPhysicalAbuse: false,
  subCatSexualAbuse: false,
  subCatOsaec: false,
  subCatCicl: false,
  subCatAtRisk: false,
  subCatStreetChild: false,
  subCatChildWithHiv: false,
  isPwd: false,
  pwdType: null,
  hasSpecialNeeds: false,
  specialNeedsDiagnosis: null,
  familyIs4ps: false,
  familySoloParent: false,
  familyIndigenous: false,
  familyParentPwd: false,
  familyInformalSettler: false,
  dateOfAdmission: new Date().toISOString().slice(0, 10),
  ageUponAdmission: '',
  presentAge: '',
  lengthOfStay: '',
  referralSource: '',
  referringAgencyPerson: null,
  dateColbRegistered: null,
  dateColbObtained: null,
  assignedSocialWorker: '',
  initialCaseAssessment: '',
  dateCaseStudyPrepared: null,
  reintegrationType: 'Not Started',
  reintegrationStatus: 'Not Started',
  initialRiskLevel: 'Medium',
  currentRiskLevel: 'Medium',
};

function riskBadgeClass(risk: string): string {
  const r = risk?.toLowerCase() ?? '';
  if (r.includes('high')) return 'bg-destructive/10 text-destructive';
  if (r.includes('low')) return 'bg-green-100 text-green-800';
  return 'bg-yellow-100 text-yellow-800';
}

function statusBadgeClass(status: string): string {
  const s = status?.toLowerCase() ?? '';
  if (s === 'closed') return 'bg-muted text-muted-foreground';
  if (s === 'transferred') return 'bg-blue-100 text-blue-800';
  return 'bg-green-100 text-green-800';
}

export default function CaseloadInventoryPage() {
  const [filters, setFilters] = useState<CaseloadFilters>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formInput, setFormInput] = useState<ResidentInput>(EMPTY_INPUT);
  const [formEditingId, setFormEditingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const list = useCaseloadList(filters, page, pageSize);
  const detail = useCaseloadDetail(selectedId);
  const safehouses = useSafehouses();
  const filterOptions = useCaseloadFilters();
  const mutations = useCaseloadMutations();

  const rows = list.data?.items ?? [];
  const totalCount = list.data?.totalCount ?? 0;
  const currentPage = list.data?.page ?? page;
  const totalPages = list.data?.totalPages ?? 1;

  const updateFilters = (next: CaseloadFilters) => {
    setFilters(next);
    setPage(1);
  };

  const openCreate = () => {
    setFormMode('create');
    setFormEditingId(null);
    setFormInput({
      ...EMPTY_INPUT,
      safehouseId: safehouses.data?.[0]?.safehouseId ?? 0,
    });
    setFormOpen(true);
  };

  const openEdit = (d: ResidentDetail) => {
    const r = d.resident;
    setFormMode('edit');
    setFormEditingId(r.residentId);
    setFormInput({ ...r });
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formMode === 'create') {
      const res = await mutations.create(formInput);
      if (!res.error) {
        setFormOpen(false);
        list.refetch();
      }
    } else if (formEditingId != null) {
      const res = await mutations.update(formEditingId, formInput);
      if (!res.error) {
        setFormOpen(false);
        list.refetch();
        detail.refetch();
      }
    }
  };

  const handleDelete = async (id: number) => {
    const res = await mutations.softDelete(id);
    if (!res.error) {
      setDeleteConfirmId(null);
      setSelectedId(null);
      list.refetch();
    }
  };

  const requiredValid = useMemo(() => {
    return (
      formInput.caseControlNo.trim() !== '' &&
      formInput.safehouseId > 0 &&
      formInput.caseCategory.trim() !== '' &&
      formInput.referralSource.trim() !== '' &&
      formInput.assignedSocialWorker.trim() !== '' &&
      formInput.initialCaseAssessment.trim() !== ''
    );
  }, [formInput]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StaffHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 lg:py-16">
        <div className="mb-10 flex items-start justify-between gap-6 flex-wrap">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
              Internal Use Only
            </p>
            <h1 className="text-4xl lg:text-5xl font-serif text-foreground mb-4">Caseload Inventory</h1>
            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
              Active resident management. Demographics, case category, admission, social worker, reintegration.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-5 py-3 rounded-full bg-primary text-white font-semibold hover:opacity-90"
          >
            + New Resident
          </button>
        </div>

        <MlResidentWellbeingPanel />
        <MlEarlyWarningPanel />
        <MlReintegrationReadinessPanel />

        {/* Filter Bar */}
        <section className="bg-white rounded-2xl p-4 border border-border shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center flex-wrap">
            <div className="flex-1 min-w-[220px] flex items-center gap-3 px-4 py-3 rounded-xl bg-background border border-border">
              <Search className="w-5 h-5 opacity-50" />
              <input
                type="text"
                value={filters.search ?? ''}
                onChange={(e) => updateFilters({ ...filters, search: e.target.value || undefined })}
                placeholder="Search by case control number..."
                className="bg-transparent outline-none flex-1 text-base"
                aria-label="Search by case control number"
              />
            </div>
            <select
              value={filters.status ?? ''}
              onChange={(e) => updateFilters({ ...filters, status: e.target.value || undefined })}
              className="px-4 py-3 rounded-xl bg-background border border-border text-foreground font-medium"
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              {(filterOptions.data?.statuses ?? []).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={filters.safehouseId ?? ''}
              onChange={(e) =>
                updateFilters({
                  ...filters,
                  safehouseId: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="px-4 py-3 rounded-xl bg-background border border-border text-foreground font-medium"
              aria-label="Filter by safehouse"
            >
              <option value="">All Safehouses</option>
              {(safehouses.data ?? []).map((s) => (
                <option key={s.safehouseId} value={s.safehouseId}>{s.name}</option>
              ))}
            </select>
            <select
              value={filters.category ?? ''}
              onChange={(e) => updateFilters({ ...filters, category: e.target.value || undefined })}
              className="px-4 py-3 rounded-xl bg-background border border-border text-foreground font-medium"
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {(filterOptions.data?.categories ?? []).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={filters.riskLevel ?? ''}
              onChange={(e) => updateFilters({ ...filters, riskLevel: e.target.value || undefined })}
              className="px-4 py-3 rounded-xl bg-background border border-border text-foreground font-medium"
              aria-label="Filter by risk level"
            >
              <option value="">All Risk Levels</option>
              {(filterOptions.data?.riskLevels ?? []).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="mt-3 text-sm text-muted-foreground flex items-center gap-4 flex-wrap">
            <span className="inline-flex items-center gap-1"><Filter className="w-4 h-4" /> {totalCount} result{totalCount === 1 ? '' : 's'}</span>
            {list.error && (
              <span className="inline-flex items-center gap-1 text-destructive"><AlertTriangle className="w-4 h-4" /> {list.error}</span>
            )}
          </div>
        </section>

        {/* Residents Table */}
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left" aria-label="Resident caseload table">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  {['Case #', 'Category', 'Safehouse', 'Admitted', 'Social Worker', 'Risk', 'Status', ''].map((col, i) => (
                    <th
                      key={col}
                      scope="col"
                      className={`px-5 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap ${i === 7 ? 'text-right' : ''}`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.loading && (
                  <tr><td colSpan={8} className="px-5 py-8 text-center text-muted-foreground">Loading residents...</td></tr>
                )}
                {!list.loading && rows.length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-8 text-center text-muted-foreground">No residents match your filters</td></tr>
                )}
                {rows.map((r) => (
                  <tr key={r.residentId} className="hover:bg-background/80 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="font-medium text-foreground">{r.caseControlNo}</div>
                      <div className="text-xs text-muted-foreground">#{r.residentId}</div>
                    </td>
                    <td className="px-5 py-4 text-foreground whitespace-nowrap">
                      <span className="inline-flex items-center gap-1"><Tag className="w-3 h-3 opacity-60" />{r.caseCategory}</span>
                    </td>
                    <td className="px-5 py-4 text-foreground whitespace-nowrap">
                      <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3 opacity-60" />{r.safehouseName}</span>
                    </td>
                    <td className="px-5 py-4 text-foreground whitespace-nowrap text-sm">{r.dateOfAdmission}</td>
                    <td className="px-5 py-4 text-foreground whitespace-nowrap text-sm">{r.assignedSocialWorker}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-[11px] font-bold uppercase ${riskBadgeClass(r.currentRiskLevel)}`}>
                        {r.currentRiskLevel}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-[11px] font-bold uppercase ${statusBadgeClass(r.caseStatus)}`}>
                        {r.caseStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 px-4 py-1.5 rounded-full border border-primary text-primary text-xs font-medium hover:bg-primary hover:text-white transition-all"
                        onClick={() => setSelectedId(r.residentId)}
                        aria-label={`View ${r.caseControlNo}`}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm">
              <label htmlFor="caseload-page-size" className="text-muted-foreground">
                Rows per page
              </label>
              <select
                id="caseload-page-size"
                className="rounded-md border border-border bg-white px-2 py-1 text-foreground"
                value={pageSize}
                onChange={(e) => {
                  const nextSize = Number(e.target.value);
                  setPageSize(nextSize);
                  setPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {totalCount === 0 ? 'No records' : `Page ${currentPage} of ${totalPages} (${totalCount} records)`}
              </span>
              <button
                type="button"
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={list.loading || currentPage <= 1}
                onClick={() => setPage(Math.max(1, currentPage - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={list.loading || currentPage >= totalPages}
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Detail drawer */}
      {selectedId != null && (
        <DetailDrawer
          detail={detail.data ?? null}
          loading={detail.loading}
          onClose={() => setSelectedId(null)}
          onEdit={(d) => openEdit(d)}
          onDelete={(id) => setDeleteConfirmId(id)}
        />
      )}

      {/* Form modal */}
      {formOpen && (
        <FormModal
          mode={formMode}
          input={formInput}
          setInput={setFormInput}
          safehouses={safehouses.data ?? []}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmit}
          saving={mutations.saving}
          error={mutations.error}
          requiredValid={requiredValid}
        />
      )}

      {/* Delete confirmation */}
      {deleteConfirmId != null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-serif text-foreground mb-2">Close case?</h2>
            <p className="text-sm text-muted-foreground mb-4">
              This will mark the case as Closed and set today's date as the close date. The record is preserved.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-full border border-border text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-full bg-destructive text-white font-medium"
              >
                Close Case
              </button>
            </div>
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  );
}

// --- subcomponents ---

function DetailDrawer(props: {
  detail: ResidentDetail | null;
  loading: boolean;
  onClose: () => void;
  onEdit: (d: ResidentDetail) => void;
  onDelete: (id: number) => void;
}) {
  const { detail, loading, onClose, onEdit, onDelete } = props;
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside className="relative bg-white w-full max-w-xl h-full overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-serif text-foreground">Resident Detail</h2>
          <button onClick={onClose} aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        {loading && <div className="p-6 text-muted-foreground">Loading...</div>}
        {!loading && detail && (
          <div className="p-6 space-y-6">
            <Section title="Identity">
              <KV k="Case Control No." v={detail.resident.caseControlNo} />
              <KV k="Internal Code" v={String(detail.resident.internalCode)} />
              <KV k="Sex" v={detail.resident.sex} />
              <KV k="Date of Birth" v={detail.resident.dateOfBirth} />
              <KV k="Birth Status" v={detail.resident.birthStatus} />
              <KV k="Place of Birth" v={detail.resident.placeOfBirth} />
              <KV k="Religion" v={detail.resident.religion} />
              <KV k="Present Age" v={detail.resident.presentAge} />
            </Section>
            <Section title="Case">
              <KV k="Status" v={detail.resident.caseStatus} />
              <KV k="Category" v={detail.resident.caseCategory} />
              <KV k="Initial Risk" v={detail.resident.initialRiskLevel} />
              <KV k="Current Risk" v={detail.resident.currentRiskLevel} />
              <div className="col-span-2 text-sm text-muted-foreground">
                Sub-categories: {[
                  detail.resident.subCatOrphaned && 'Orphaned',
                  detail.resident.subCatTrafficked && 'Trafficked',
                  detail.resident.subCatChildLabor && 'Child Labor',
                  detail.resident.subCatPhysicalAbuse && 'Physical Abuse',
                  detail.resident.subCatSexualAbuse && 'Sexual Abuse',
                  detail.resident.subCatOsaec && 'OSAEC',
                  detail.resident.subCatCicl && 'CICL',
                  detail.resident.subCatAtRisk && 'At Risk',
                  detail.resident.subCatStreetChild && 'Street Child',
                  detail.resident.subCatChildWithHiv && 'Child w/ HIV',
                ].filter(Boolean).join(', ') || 'None'}
              </div>
            </Section>
            <Section title="Disability / Special Needs">
              <KV k="Is PWD" v={detail.resident.isPwd ? 'Yes' : 'No'} />
              <KV k="PWD Type" v={detail.resident.pwdType ?? '—'} />
              <KV k="Has Special Needs" v={detail.resident.hasSpecialNeeds ? 'Yes' : 'No'} />
              <KV k="Diagnosis" v={detail.resident.specialNeedsDiagnosis ?? '—'} />
            </Section>
            <Section title="Family">
              <KV k="4Ps" v={detail.resident.familyIs4ps ? 'Yes' : 'No'} />
              <KV k="Solo Parent" v={detail.resident.familySoloParent ? 'Yes' : 'No'} />
              <KV k="Indigenous" v={detail.resident.familyIndigenous ? 'Yes' : 'No'} />
              <KV k="Parent PWD" v={detail.resident.familyParentPwd ? 'Yes' : 'No'} />
              <KV k="Informal Settler" v={detail.resident.familyInformalSettler ? 'Yes' : 'No'} />
            </Section>
            <Section title="Admission">
              <KV k="Safehouse" v={detail.safehouseName} />
              <KV k="Date of Admission" v={detail.resident.dateOfAdmission} />
              <KV k="Age Upon Admission" v={detail.resident.ageUponAdmission} />
              <KV k="Length of Stay" v={detail.resident.lengthOfStay} />
            </Section>
            <Section title="Referral">
              <KV k="Source" v={detail.resident.referralSource} />
              <KV k="Agency / Person" v={detail.resident.referringAgencyPerson ?? '—'} />
              <KV k="COLB Registered" v={detail.resident.dateColbRegistered ?? '—'} />
              <KV k="COLB Obtained" v={detail.resident.dateColbObtained ?? '—'} />
            </Section>
            <Section title="Case Management">
              <KV k="Social Worker" v={detail.resident.assignedSocialWorker} />
              <KV k="Initial Assessment" v={detail.resident.initialCaseAssessment} />
              <KV k="Case Study Prepared" v={detail.resident.dateCaseStudyPrepared ?? '—'} />
            </Section>
            <Section title="Reintegration">
              <KV k="Type" v={detail.resident.reintegrationType} />
              <KV k="Status" v={detail.resident.reintegrationStatus} />
              <KV k="Date Closed" v={detail.resident.dateClosed ?? '—'} />
            </Section>
            <Section title="Related Counts">
              <KV k="Process Recordings" v={String(detail.processRecordingCount)} />
              <KV k="Home Visits" v={String(detail.homeVisitCount)} />
              <KV k="Open Intervention Plans" v={String(detail.openInterventionPlansCount)} />
              <KV k="Incidents" v={String(detail.incidentCount)} />
            </Section>

            <div className="flex gap-3 pt-4 border-t border-border">
              <button
                onClick={() => onEdit(detail)}
                className="px-5 py-2 rounded-full bg-primary text-white font-medium"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(detail.resident.residentId)}
                className="px-5 py-2 rounded-full border border-destructive text-destructive font-medium"
              >
                Close Case
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">{children}</div>
    </section>
  );
}

function KV({ k, v }: { k: string; v: string | number }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="text-sm text-foreground">{v || '—'}</div>
    </div>
  );
}

function FormModal(props: {
  mode: 'create' | 'edit';
  input: ResidentInput;
  setInput: (i: ResidentInput) => void;
  safehouses: { safehouseId: number; name: string }[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  error: string | null;
  requiredValid: boolean;
}) {
  const { mode, input, setInput, safehouses, onClose, onSubmit, saving, error, requiredValid } = props;
  const upd = <K extends keyof ResidentInput>(k: K, v: ResidentInput[K]) => setInput({ ...input, [k]: v });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
      >
        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-serif text-foreground">
            {mode === 'create' ? 'New Resident' : 'Edit Resident'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          <FormSection title="Required">
            <Field label="Case Control No. *">
              <input required value={input.caseControlNo} onChange={(e) => upd('caseControlNo', e.target.value)} className="input" />
            </Field>
            <Field label="Internal Code *">
              <input required type="number" step="0.01" value={input.internalCode} onChange={(e) => upd('internalCode', Number(e.target.value))} className="input" />
            </Field>
            <Field label="Safehouse *">
              <select required value={input.safehouseId} onChange={(e) => upd('safehouseId', Number(e.target.value))} className="input">
                <option value={0}>-- select --</option>
                {safehouses.map((s) => <option key={s.safehouseId} value={s.safehouseId}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Sex *">
              <select value={input.sex} onChange={(e) => upd('sex', e.target.value)} className="input">
                <option value="F">F</option>
                <option value="M">M</option>
              </select>
            </Field>
            <Field label="Date of Birth *">
              <input required type="date" value={input.dateOfBirth} onChange={(e) => upd('dateOfBirth', e.target.value)} className="input" />
            </Field>
            <Field label="Place of Birth *">
              <input required value={input.placeOfBirth} onChange={(e) => upd('placeOfBirth', e.target.value)} className="input" />
            </Field>
            <Field label="Case Category *">
              <select required value={input.caseCategory} onChange={(e) => upd('caseCategory', e.target.value)} className="input">
                <option value="">-- select --</option>
                <option value="Abandoned">Abandoned</option>
                <option value="Foundling">Foundling</option>
                <option value="Surrendered">Surrendered</option>
                <option value="Neglected">Neglected</option>
              </select>
            </Field>
            <Field label="Date of Admission *">
              <input required type="date" value={input.dateOfAdmission} onChange={(e) => upd('dateOfAdmission', e.target.value)} className="input" />
            </Field>
            <Field label="Referral Source *">
              <input required value={input.referralSource} onChange={(e) => upd('referralSource', e.target.value)} className="input" />
            </Field>
            <Field label="Assigned Social Worker *">
              <input required value={input.assignedSocialWorker} onChange={(e) => upd('assignedSocialWorker', e.target.value)} className="input" />
            </Field>
            <Field label="Initial Case Assessment *">
              <input required value={input.initialCaseAssessment} onChange={(e) => upd('initialCaseAssessment', e.target.value)} className="input" />
            </Field>
            <Field label="Case Status *">
              <select value={input.caseStatus} onChange={(e) => upd('caseStatus', e.target.value)} className="input">
                <option value="Active">Active</option>
                <option value="Closed">Closed</option>
                <option value="Transferred">Transferred</option>
              </select>
            </Field>
            <Field label="Initial Risk Level *">
              <select value={input.initialRiskLevel} onChange={(e) => upd('initialRiskLevel', e.target.value)} className="input">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </Field>
            <Field label="Current Risk Level *">
              <select value={input.currentRiskLevel} onChange={(e) => upd('currentRiskLevel', e.target.value)} className="input">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </Field>
          </FormSection>

          <FormSection title="Optional — Identity">
            <Field label="Birth Status"><input value={input.birthStatus} onChange={(e) => upd('birthStatus', e.target.value)} className="input" /></Field>
            <Field label="Religion"><input value={input.religion} onChange={(e) => upd('religion', e.target.value)} className="input" /></Field>
            <Field label="Present Age"><input value={input.presentAge} onChange={(e) => upd('presentAge', e.target.value)} className="input" /></Field>
            <Field label="Age Upon Admission"><input value={input.ageUponAdmission} onChange={(e) => upd('ageUponAdmission', e.target.value)} className="input" /></Field>
            <Field label="Length of Stay"><input value={input.lengthOfStay} onChange={(e) => upd('lengthOfStay', e.target.value)} className="input" /></Field>
          </FormSection>

          <FormSection title="Sub-categories">
            {([
              ['subCatOrphaned', 'Orphaned'],
              ['subCatTrafficked', 'Trafficked'],
              ['subCatChildLabor', 'Child Labor'],
              ['subCatPhysicalAbuse', 'Physical Abuse'],
              ['subCatSexualAbuse', 'Sexual Abuse'],
              ['subCatOsaec', 'OSAEC'],
              ['subCatCicl', 'CICL'],
              ['subCatAtRisk', 'At Risk'],
              ['subCatStreetChild', 'Street Child'],
              ['subCatChildWithHiv', 'Child w/ HIV'],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={input[key] as boolean}
                  onChange={(e) => upd(key, e.target.checked as ResidentInput[typeof key])}
                />
                {label}
              </label>
            ))}
          </FormSection>

          <FormSection title="Disability / Special Needs">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={input.isPwd} onChange={(e) => upd('isPwd', e.target.checked)} /> Is PWD
            </label>
            <Field label="PWD Type"><input value={input.pwdType ?? ''} onChange={(e) => upd('pwdType', e.target.value || null)} className="input" /></Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={input.hasSpecialNeeds} onChange={(e) => upd('hasSpecialNeeds', e.target.checked)} /> Has Special Needs
            </label>
            <Field label="Diagnosis"><input value={input.specialNeedsDiagnosis ?? ''} onChange={(e) => upd('specialNeedsDiagnosis', e.target.value || null)} className="input" /></Field>
          </FormSection>

          <FormSection title="Family">
            {([
              ['familyIs4ps', '4Ps'],
              ['familySoloParent', 'Solo Parent'],
              ['familyIndigenous', 'Indigenous'],
              ['familyParentPwd', 'Parent PWD'],
              ['familyInformalSettler', 'Informal Settler'],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={input[key] as boolean}
                  onChange={(e) => upd(key, e.target.checked as ResidentInput[typeof key])}
                />
                {label}
              </label>
            ))}
          </FormSection>

          <FormSection title="Referral / Case Study">
            <Field label="Referring Agency / Person"><input value={input.referringAgencyPerson ?? ''} onChange={(e) => upd('referringAgencyPerson', e.target.value || null)} className="input" /></Field>
            <Field label="COLB Registered"><input type="date" value={input.dateColbRegistered ?? ''} onChange={(e) => upd('dateColbRegistered', e.target.value || null)} className="input" /></Field>
            <Field label="COLB Obtained"><input type="date" value={input.dateColbObtained ?? ''} onChange={(e) => upd('dateColbObtained', e.target.value || null)} className="input" /></Field>
            <Field label="Case Study Prepared"><input type="date" value={input.dateCaseStudyPrepared ?? ''} onChange={(e) => upd('dateCaseStudyPrepared', e.target.value || null)} className="input" /></Field>
          </FormSection>

          <FormSection title="Reintegration">
            <Field label="Type"><input value={input.reintegrationType} onChange={(e) => upd('reintegrationType', e.target.value)} className="input" /></Field>
            <Field label="Status"><input value={input.reintegrationStatus} onChange={(e) => upd('reintegrationStatus', e.target.value)} className="input" /></Field>
          </FormSection>

          {error && <div className="text-sm text-destructive">{error}</div>}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-border px-6 py-4 flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="px-5 py-2 rounded-full border border-border text-foreground">Cancel</button>
          <button
            type="submit"
            disabled={!requiredValid || saving}
            className="px-5 py-2 rounded-full bg-primary text-white font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving...' : mode === 'create' ? 'Create' : 'Save Changes'}
          </button>
        </div>
      </form>

      <style>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          font-size: 0.875rem;
        }
        .input:focus { outline: 2px solid hsl(var(--primary)); outline-offset: 1px; }
      `}</style>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}
