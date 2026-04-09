import { useMemo, useState } from 'react';
import AppHeader from '@/components/shared/AppHeader';
import PublicFooter from '@/components/shared/PublicFooter';
import { useResidentsForPicker } from '@/hooks/useProcessRecording';
import {
  useVisits,
  useCaseConferences,
  useVisitMutations,
} from '@/hooks/useVisitationLogs';
import {
  type HomeVisit,
  type HomeVisitInput,
  VISIT_TYPES,
  COOPERATION_LEVELS,
} from '@/types/visitationLogs';

const emptyInput = (residentId: number): HomeVisitInput => ({
  residentId,
  visitDate: new Date().toISOString().slice(0, 10),
  socialWorker: '',
  visitType: 'Follow-up',
  locationVisited: '',
  familyMembersPresent: '',
  purpose: '',
  observations: '',
  familyCooperationLevel: 'Moderate',
  safetyConcernsNoted: false,
  followUpNeeded: false,
  followUpNotes: '',
  visitOutcome: '',
});

export default function VisitationLogsPage() {
  const residents = useResidentsForPicker();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [visitsPage, setVisitsPage] = useState(1);
  const [visitsPageSize, setVisitsPageSize] = useState(10);

  const effectiveId =
    selectedId ?? (residents.data && residents.data.length > 0 ? residents.data[0].residentId : null);

  const visits = useVisits(effectiveId, visitsPage, visitsPageSize);
  const conferences = useCaseConferences(effectiveId);
  const mutations = useVisitMutations();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<HomeVisitInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredResidents = useMemo(() => {
    if (!residents.data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return residents.data;
    return residents.data.filter(
      (r) =>
        r.caseControlNo.toLowerCase().includes(q) ||
        r.assignedSocialWorker.toLowerCase().includes(q),
    );
  }, [residents.data, search]);

  const selectedResident =
    residents.data?.find((r) => r.residentId === effectiveId) ?? null;

  function openNew() {
    if (effectiveId == null) return;
    setEditingId(null);
    setForm(emptyInput(effectiveId));
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(v: HomeVisit) {
    setEditingId(v.visitationId);
    setForm({
      residentId: v.residentId,
      visitDate: v.visitDate.slice(0, 10),
      socialWorker: v.socialWorker,
      visitType: v.visitType,
      locationVisited: v.locationVisited,
      familyMembersPresent: v.familyMembersPresent,
      purpose: v.purpose,
      observations: v.observations ?? '',
      familyCooperationLevel: v.familyCooperationLevel,
      safetyConcernsNoted: v.safetyConcernsNoted,
      followUpNeeded: v.followUpNeeded,
      followUpNotes: v.followUpNotes ?? '',
      visitOutcome: v.visitOutcome,
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (!form.socialWorker.trim() || !form.visitDate || !form.purpose.trim()) {
      setFormError('Visit date, social worker, and purpose are required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    const res = editingId
      ? await mutations.update(editingId, form)
      : await mutations.create(form);
    setSaving(false);
    if (res.error) {
      setFormError(res.error);
      return;
    }
    setModalOpen(false);
    setForm(null);
    setEditingId(null);
    visits.refetch();
  }

  async function deleteVisit(id: number) {
    if (!confirm('Delete this visit? This action cannot be undone.')) return;
    const res = await mutations.remove(id);
    if (res.error) {
      alert(`Delete failed: ${res.error}`);
      return;
    }
    visits.refetch();
  }

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">
              Internal Use Only
            </p>
            <h1 className="text-4xl font-serif text-foreground mb-2">
              Home Visitation &amp; Case Conferences
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Log family home visits, review visit history, and track case conference outcomes per resident.
            </p>
          </div>
          <button
            onClick={openNew}
            disabled={effectiveId == null}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition text-sm font-medium disabled:opacity-50"
          >
            + New Visit
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="border border-border rounded-lg bg-card">
              <div className="p-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground mb-2">Residents</h2>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search case # or worker…"
                  className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <ul className="max-h-[70vh] overflow-y-auto">
                {residents.loading && (
                  <li className="p-4 text-sm text-muted-foreground">Loading…</li>
                )}
                {!residents.loading && filteredResidents.length === 0 && (
                  <li className="p-4 text-sm text-muted-foreground">No residents found.</li>
                )}
                {filteredResidents.map((r) => (
                  <li key={r.residentId}>
                    <button
                      onClick={() => {
                        setSelectedId(r.residentId);
                        setVisitsPage(1);
                      }}
                      className={`w-full text-left px-4 py-3 border-b border-border transition ${
                        r.residentId === effectiveId
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="text-sm font-semibold">{r.caseControlNo}</div>
                      <div className="text-xs text-muted-foreground">
                        Age {r.presentAge} · {r.assignedSocialWorker}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <section className="space-y-8">
            <div>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-2xl font-serif text-foreground">
                  Visit History
                  {selectedResident && (
                    <span className="text-base text-muted-foreground ml-2">
                      · {selectedResident.caseControlNo}
                    </span>
                  )}
                </h2>
                {visits.error && (
                  <span className="text-xs text-muted-foreground">
                    Using sample data ({visits.error})
                  </span>
                )}
              </div>

              {visits.loading && (
                <p className="text-sm text-muted-foreground">Loading visits…</p>
              )}
              {!visits.loading && (visits.data?.items.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground">No visits recorded yet.</p>
              )}

              <ul className="space-y-4">
                {visits.data?.items.map((v) => (
                  <li
                    key={v.visitationId}
                    className="border border-border rounded-lg bg-card p-5"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {v.visitDate} · {v.visitType}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {v.socialWorker} · {v.locationVisited}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(v)}
                          className="px-3 py-1 text-xs rounded border border-border hover:bg-muted"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteVisit(v.visitationId)}
                          className="px-3 py-1 text-xs rounded border border-border text-destructive hover:bg-muted"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-4 text-sm">
                      <div>
                        <dt className="text-xs uppercase text-muted-foreground">Purpose</dt>
                        <dd className="text-foreground">{v.purpose}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase text-muted-foreground">Family present</dt>
                        <dd className="text-foreground">{v.familyMembersPresent || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase text-muted-foreground">Cooperation</dt>
                        <dd className="text-foreground">{v.familyCooperationLevel}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase text-muted-foreground">Outcome</dt>
                        <dd className="text-foreground">{v.visitOutcome || '—'}</dd>
                      </div>
                      {v.observations && (
                        <div className="sm:col-span-2">
                          <dt className="text-xs uppercase text-muted-foreground">Observations</dt>
                          <dd className="text-foreground">{v.observations}</dd>
                        </div>
                      )}
                      {v.followUpNeeded && (
                        <div className="sm:col-span-2">
                          <dt className="text-xs uppercase text-muted-foreground">Follow-up</dt>
                          <dd className="text-foreground">{v.followUpNotes || 'Follow-up required'}</dd>
                        </div>
                      )}
                      {v.safetyConcernsNoted && (
                        <div className="sm:col-span-2 text-xs font-semibold text-destructive">
                          Safety concerns noted
                        </div>
                      )}
                    </dl>
                  </li>
                ))}
              </ul>

              {!visits.loading && visits.data && visits.data.totalCount > 0 ? (
                <div className="mt-4 border border-border rounded-lg bg-card px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <label htmlFor="visits-page-size" className="text-muted-foreground">
                      Rows per page
                    </label>
                    <select
                      id="visits-page-size"
                      className="rounded-md border border-border bg-white px-2 py-1 text-foreground"
                      value={visitsPageSize}
                      onChange={(e) => {
                        setVisitsPageSize(Number(e.target.value));
                        setVisitsPage(1);
                      }}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      Page {visits.data.page} of {visits.data.totalPages} ({visits.data.totalCount} records)
                    </span>
                    <button
                      type="button"
                      className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={visits.loading || visits.data.page <= 1}
                      onClick={() => setVisitsPage(Math.max(1, visits.data!.page - 1))}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={visits.loading || visits.data.page >= visits.data.totalPages}
                      onClick={() => setVisitsPage(Math.min(visits.data!.totalPages, visits.data!.page + 1))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <div>
              <h2 className="text-2xl font-serif text-foreground mb-4">Case Conference History</h2>
              {conferences.loading && (
                <p className="text-sm text-muted-foreground">Loading conferences…</p>
              )}
              {!conferences.loading && (conferences.data?.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground">No case conferences on file.</p>
              )}
              <ul className="space-y-3">
                {conferences.data?.map((c) => (
                  <li
                    key={c.planId}
                    className="border border-border rounded-lg bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {c.caseConferenceDate} · {c.planCategory}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Services: {c.servicesProvided} · Status: {c.status}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-foreground mt-2">{c.planDescription}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </main>

      {modalOpen && form && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={submitForm} className="p-6">
              <h3 className="text-xl font-serif text-foreground mb-4">
                {editingId ? 'Edit Visit' : 'New Visit'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="text-sm">
                  <span className="block text-xs uppercase text-muted-foreground mb-1">Visit date *</span>
                  <input
                    type="date"
                    required
                    value={form.visitDate}
                    onChange={(e) => setForm({ ...form, visitDate: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-border bg-background text-foreground"
                  />
                </label>
                <label className="text-sm">
                  <span className="block text-xs uppercase text-muted-foreground mb-1">Social worker *</span>
                  <input
                    type="text"
                    required
                    value={form.socialWorker}
                    onChange={(e) => setForm({ ...form, socialWorker: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-border bg-background text-foreground"
                  />
                </label>
                <label className="text-sm">
                  <span className="block text-xs uppercase text-muted-foreground mb-1">Visit type</span>
                  <select
                    value={form.visitType}
                    onChange={(e) => setForm({ ...form, visitType: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-border bg-background text-foreground"
                  >
                    {VISIT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="block text-xs uppercase text-muted-foreground mb-1">Cooperation level</span>
                  <select
                    value={form.familyCooperationLevel}
                    onChange={(e) => setForm({ ...form, familyCooperationLevel: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-border bg-background text-foreground"
                  >
                    {COOPERATION_LEVELS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="block text-xs uppercase text-muted-foreground mb-1">Location visited</span>
                  <input
                    type="text"
                    value={form.locationVisited}
                    onChange={(e) => setForm({ ...form, locationVisited: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-border bg-background text-foreground"
                  />
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="block text-xs uppercase text-muted-foreground mb-1">Family members present</span>
                  <input
                    type="text"
                    value={form.familyMembersPresent}
                    onChange={(e) => setForm({ ...form, familyMembersPresent: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-border bg-background text-foreground"
                  />
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="block text-xs uppercase text-muted-foreground mb-1">Purpose *</span>
                  <input
                    type="text"
                    required
                    value={form.purpose}
                    onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-border bg-background text-foreground"
                  />
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="block text-xs uppercase text-muted-foreground mb-1">Observations</span>
                  <textarea
                    rows={3}
                    value={form.observations ?? ''}
                    onChange={(e) => setForm({ ...form, observations: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-border bg-background text-foreground"
                  />
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="block text-xs uppercase text-muted-foreground mb-1">Visit outcome</span>
                  <input
                    type="text"
                    value={form.visitOutcome}
                    onChange={(e) => setForm({ ...form, visitOutcome: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-border bg-background text-foreground"
                  />
                </label>
                <label className="text-sm flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.safetyConcernsNoted}
                    onChange={(e) => setForm({ ...form, safetyConcernsNoted: e.target.checked })}
                  />
                  Safety concerns noted
                </label>
                <label className="text-sm flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.followUpNeeded}
                    onChange={(e) => setForm({ ...form, followUpNeeded: e.target.checked })}
                  />
                  Follow-up needed
                </label>
                {form.followUpNeeded && (
                  <label className="text-sm sm:col-span-2">
                    <span className="block text-xs uppercase text-muted-foreground mb-1">Follow-up notes</span>
                    <input
                      type="text"
                      value={form.followUpNotes ?? ''}
                      onChange={(e) => setForm({ ...form, followUpNotes: e.target.value })}
                      className="w-full px-3 py-2 rounded border border-border bg-background text-foreground"
                    />
                  </label>
                )}
              </div>

              {formError && (
                <p className="text-sm text-destructive mt-4">{formError}</p>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setForm(null);
                    setEditingId(null);
                  }}
                  className="px-4 py-2 rounded border border-border text-sm hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  );
}
