import { useMemo, useState } from 'react';
import AppHeader from '@/components/shared/AppHeader';
import PublicFooter from '@/components/shared/PublicFooter';
import {
  useResidentsForPicker,
  useProcessRecordings,
  type ProcessRecordingSession,
} from '@/hooks/useProcessRecording';
import { apiDelete, apiPost, apiPut } from '@/lib/api';

export default function ProcessRecordingPage() {
  const residents = useResidentsForPicker();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [sessionPage, setSessionPage] = useState(1);
  const [sessionPageSize, setSessionPageSize] = useState(10);
  const [editingSession, setEditingSession] = useState<ProcessRecordingSession | null>(null);
  const [deletingSession, setDeletingSession] = useState<ProcessRecordingSession | null>(null);

  const effectiveId =
    selectedId ?? (residents.data && residents.data.length > 0 ? residents.data[0].residentId : null);

  const sessions = useProcessRecordings(effectiveId, sessionPage, sessionPageSize, reloadToken);

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

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex items-start justify-between mb-8">
              <div>
            <h1 className="text-4xl font-serif text-foreground mb-2">Process Recording</h1>
            <p className="text-muted-foreground">
              Counseling session notes and chronological history per resident.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition text-sm font-medium"
          >
            + New Entry
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
                        setSessionPage(1);
                      }}
                      className={`w-full text-left px-4 py-3 border-b border-border transition ${
                        r.residentId === effectiveId
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="font-medium text-sm">{r.caseControlNo}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Age {r.presentAge} · {r.assignedSocialWorker}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Risk: {r.currentRiskLevel}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <section>
            {selectedResident && (
              <div className="mb-4 p-4 border border-border rounded-lg bg-card">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  Selected Resident
                </div>
                <div className="font-serif text-xl text-foreground mt-1">
                  {selectedResident.caseControlNo}
                </div>
                <div className="text-sm text-muted-foreground">
                  Safehouse #{selectedResident.safehouseId} · {selectedResident.caseStatus} ·
                  Assigned to {selectedResident.assignedSocialWorker}
                </div>
              </div>
            )}

            {sessions.loading && (
              <div className="p-8 text-center text-muted-foreground">Loading sessions…</div>
            )}

            {!sessions.loading && sessions.data && sessions.data.items.length === 0 && (
              <div className="p-12 text-center border border-dashed border-border rounded-lg">
                <p className="text-muted-foreground">
                  No process recordings yet for this resident.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {sessions.data?.items.map((s) => (
                <SessionCard
                  key={s.recordingId}
                  session={s}
                  onEdit={() => setEditingSession(s)}
                  onDelete={() => setDeletingSession(s)}
                />
              ))}
            </div>

            {!sessions.loading && sessions.data && sessions.data.totalCount > 0 ? (
              <div className="mt-4 border border-border rounded-lg bg-card px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <label htmlFor="process-recordings-page-size" className="text-muted-foreground">
                    Rows per page
                  </label>
                  <select
                    id="process-recordings-page-size"
                    className="rounded-md border border-border bg-white px-2 py-1 text-foreground"
                    value={sessionPageSize}
                    onChange={(e) => {
                      setSessionPageSize(Number(e.target.value));
                      setSessionPage(1);
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
                    Page {sessions.data.page} of {sessions.data.totalPages} ({sessions.data.totalCount} records)
                  </span>
                  <button
                    type="button"
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={sessions.loading || sessions.data.page <= 1}
                    onClick={() => setSessionPage(Math.max(1, sessions.data!.page - 1))}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={sessions.loading || sessions.data.page >= sessions.data.totalPages}
                    onClick={() => setSessionPage(Math.min(sessions.data!.totalPages, sessions.data!.page + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}

            {sessions.error && (
              <div className="mt-4 text-xs text-muted-foreground">
                Showing mock data — backend unavailable ({sessions.error}).
              </div>
            )}
          </section>
        </div>
      </main>

      {modalOpen && (
        <NewEntryModal
          onClose={() => setModalOpen(false)}
          residents={residents.data ?? []}
          defaultResidentId={effectiveId}
          onCreated={() => {
            setModalOpen(false);
            setReloadToken((v) => v + 1);
          }}
        />
      )}

      {editingSession && (
        <EditRecordingModal
          key={editingSession.recordingId}
          session={editingSession}
          residentCaseLabel={selectedResident?.caseControlNo ?? '—'}
          onClose={() => setEditingSession(null)}
          onSaved={() => {
            setEditingSession(null);
            setReloadToken((v) => v + 1);
          }}
        />
      )}

      {deletingSession && (
        <DeleteRecordingConfirmModal
          session={deletingSession}
          onClose={() => setDeletingSession(null)}
          onDeleted={() => {
            const wasLastOnPage = sessions.data?.items.length === 1;
            setDeletingSession(null);
            if (wasLastOnPage && sessionPage > 1) setSessionPage((p) => Math.max(1, p - 1));
            setReloadToken((v) => v + 1);
          }}
        />
      )}

      <PublicFooter />
    </div>
  );
}

function SessionCard({
  session,
  onEdit,
  onDelete,
}: {
  session: ProcessRecordingSession;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const interventions = session.interventionsApplied
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <article className="border border-border rounded-lg bg-card p-5">
      <header className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="font-serif text-lg text-foreground">{session.sessionDate}</div>
          <div className="text-sm text-muted-foreground">
            {session.socialWorker} · {session.sessionDurationMinutes} min
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={onEdit}
              className="px-2.5 py-1 text-xs font-medium rounded-md border border-border text-foreground hover:bg-muted transition"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="px-2.5 py-1 text-xs font-medium rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10 transition"
            >
              Delete
            </button>
          </div>
          <span className="px-2.5 py-1 text-xs rounded-full bg-secondary text-secondary-foreground">
            {session.sessionType}
          </span>
        </div>
      </header>

      <div className="flex items-center gap-2 text-sm mb-3">
        <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">
          {session.emotionalStateObserved}
        </span>
        <span className="text-muted-foreground">→</span>
        <span className="px-2 py-0.5 rounded bg-muted text-foreground">
          {session.emotionalStateEnd}
        </span>
      </div>

      <p className="text-sm text-foreground leading-relaxed mb-3">{session.sessionNarrative}</p>

      {interventions.length > 0 && (
        <div className="mb-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
            Interventions
          </div>
          <div className="flex flex-wrap gap-1.5">
            {interventions.map((i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-xs rounded border border-border text-foreground"
              >
                {i}
              </span>
            ))}
          </div>
        </div>
      )}

      {session.followUpActions && (
        <div className="mb-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
            Follow-up
          </div>
          <p className="text-sm text-foreground">{session.followUpActions}</p>
        </div>
      )}

      <footer className="flex gap-2 pt-2 border-t border-border">
        {session.progressNoted && (
          <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">
            Progress noted
          </span>
        )}
        {session.concernsFlagged && (
          <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800">
            Concerns flagged
          </span>
        )}
        {session.referralMade && (
          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
            Referral made
          </span>
        )}
      </footer>
    </article>
  );
}

type CreateProcessRecordingRequest = {
  residentId: number;
  sessionDate: string; // yyyy-mm-dd
  socialWorker: string;
  sessionType: string;
  sessionDurationMinutes: number;
  emotionalStateObserved: string;
  emotionalStateEnd: string;
  sessionNarrative: string;
  interventionsApplied: string;
  followUpActions: string;
  progressNoted: boolean;
  concernsFlagged: boolean;
  referralMade: boolean;
  notesRestricted: string | null;
};

type UpdateProcessRecordingRequest = {
  sessionDate: string;
  socialWorker: string;
  sessionType: string;
  sessionDurationMinutes: number;
  emotionalStateObserved: string;
  emotionalStateEnd: string;
  sessionNarrative: string;
  interventionsApplied: string;
  followUpActions: string;
  progressNoted: boolean;
  concernsFlagged: boolean;
  referralMade: boolean;
  notesRestricted: string | null;
};

const STANDARD_EMOTIONS = [
  'Calm',
  'Anxious',
  'Sad',
  'Angry',
  'Hopeful',
  'Withdrawn',
  'Happy',
  'Distressed',
] as const;

const STANDARD_SESSION_TYPES = ['Individual', 'Group', 'Crisis'] as const;

function sessionDateToInput(iso: string): string {
  return iso.length >= 10 ? iso.slice(0, 10) : iso;
}

function mergeOptionList(standard: readonly string[], current: string): string[] {
  const set = new Set(standard);
  return set.has(current) ? [...standard] : [current, ...standard];
}

function EditRecordingModal({
  session,
  residentCaseLabel,
  onClose,
  onSaved,
}: {
  session: ProcessRecordingSession;
  residentCaseLabel: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sessionDate, setSessionDate] = useState(() => sessionDateToInput(session.sessionDate));
  const [socialWorker, setSocialWorker] = useState(session.socialWorker);
  const [sessionType, setSessionType] = useState(session.sessionType);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(session.sessionDurationMinutes);
  const [emotionalStateObserved, setEmotionalStateObserved] = useState(session.emotionalStateObserved);
  const [emotionalStateEnd, setEmotionalStateEnd] = useState(session.emotionalStateEnd);
  const [sessionNarrative, setSessionNarrative] = useState(session.sessionNarrative);
  const [interventionsApplied, setInterventionsApplied] = useState(session.interventionsApplied);
  const [followUpActions, setFollowUpActions] = useState(session.followUpActions);
  const [progressNoted, setProgressNoted] = useState(session.progressNoted);
  const [concernsFlagged, setConcernsFlagged] = useState(session.concernsFlagged);
  const [referralMade, setReferralMade] = useState(session.referralMade);
  const [notesRestricted, setNotesRestricted] = useState(session.notesRestricted ?? '');

  const sessionTypeOptions = mergeOptionList(STANDARD_SESSION_TYPES, sessionType);
  const emotionStartOptions = mergeOptionList(STANDARD_EMOTIONS, emotionalStateObserved);
  const emotionEndOptions = mergeOptionList(STANDARD_EMOTIONS, emotionalStateEnd);

  const canSubmit =
    !!sessionDate &&
    socialWorker.trim().length > 0 &&
    sessionDurationMinutes > 0 &&
    sessionNarrative.trim().length > 0 &&
    interventionsApplied.trim().length > 0 &&
    followUpActions.trim().length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || saving) return;
    setSaving(true);
    setError(null);

    const payload: UpdateProcessRecordingRequest = {
      sessionDate,
      socialWorker: socialWorker.trim(),
      sessionType: sessionType.trim(),
      sessionDurationMinutes,
      emotionalStateObserved: emotionalStateObserved.trim(),
      emotionalStateEnd: emotionalStateEnd.trim(),
      sessionNarrative: sessionNarrative.trim(),
      interventionsApplied: interventionsApplied.trim(),
      followUpActions: followUpActions.trim(),
      progressNoted,
      concernsFlagged,
      referralMade,
      notesRestricted: notesRestricted.trim() ? notesRestricted.trim() : null,
    };

    const res = await apiPut<UpdateProcessRecordingRequest, ProcessRecordingSession>(
      `/api/ProcessRecordings/${session.recordingId}`,
      payload,
    );
    setSaving(false);
    if (res.data !== null) {
      onSaved();
    } else {
      setError(res.error ?? 'Could not update process recording');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/35 backdrop-blur-[2px] flex items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full h-[100svh] sm:h-auto sm:max-w-3xl sm:max-h-[90svh] overflow-hidden sm:overflow-y-auto rounded-none sm:rounded-3xl border border-border bg-white shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif text-foreground">Edit Process Recording</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Resident <span className="font-medium text-foreground">{residentCaseLabel}</span> — recording
              identity and resident link cannot be changed here.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full border border-border hover:bg-background transition-colors grid place-items-center"
            aria-label="Close edit modal"
          >
            <span className="text-lg leading-none text-foreground">×</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-5">
            {error ? <p className="text-xs text-destructive mb-3">{error}</p> : null}

            <div className="space-y-3">
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground">Session date</label>
                <input
                  type="date"
                  className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-border bg-background"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs uppercase tracking-wide text-muted-foreground">Social worker</label>
                  <input
                    className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-border bg-background"
                    value={socialWorker}
                    onChange={(e) => setSocialWorker(e.target.value)}
                    placeholder="Name"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-muted-foreground">Session type</label>
                  <select
                    className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-border bg-background"
                    value={sessionType}
                    onChange={(e) => setSessionType(e.target.value)}
                  >
                    {sessionTypeOptions.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs uppercase tracking-wide text-muted-foreground">Duration (min)</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-border bg-background"
                    value={sessionDurationMinutes}
                    onChange={(e) => setSessionDurationMinutes(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Emotional state (start)
                  </label>
                  <select
                    className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-border bg-background"
                    value={emotionalStateObserved}
                    onChange={(e) => setEmotionalStateObserved(e.target.value)}
                  >
                    {emotionStartOptions.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Emotional state (end)
                  </label>
                  <select
                    className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-border bg-background"
                    value={emotionalStateEnd}
                    onChange={(e) => setEmotionalStateEnd(e.target.value)}
                  >
                    {emotionEndOptions.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground">Session narrative</label>
                <textarea
                  rows={3}
                  className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-border bg-background"
                  value={sessionNarrative}
                  onChange={(e) => setSessionNarrative(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground">Interventions applied</label>
                <textarea
                  rows={2}
                  className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-border bg-background"
                  value={interventionsApplied}
                  onChange={(e) => setInterventionsApplied(e.target.value)}
                  placeholder="e.g., CBT; grounding; art therapy"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground">Follow up actions</label>
                <textarea
                  rows={2}
                  className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-border bg-background"
                  value={followUpActions}
                  onChange={(e) => setFollowUpActions(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={progressNoted}
                    onChange={(e) => setProgressNoted(e.target.checked)}
                  />
                  Progress noted
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={concernsFlagged}
                    onChange={(e) => setConcernsFlagged(e.target.checked)}
                  />
                  Concerns flagged
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={referralMade}
                    onChange={(e) => setReferralMade(e.target.checked)}
                  />
                  Referral made
                </label>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Notes restricted (optional)
                </label>
                <textarea
                  rows={2}
                  className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-border bg-background"
                  value={notesRestricted}
                  onChange={(e) => setNotesRestricted(e.target.value)}
                  placeholder="Restricted-access notes…"
                />
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-border px-4 sm:px-6 py-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || saving}
              className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteRecordingConfirmModal({
  session,
  onClose,
  onDeleted,
}: {
  session: ProcessRecordingSession;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await apiDelete(`/api/ProcessRecordings/${session.recordingId}`);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onDeleted();
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-foreground/40 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={() => !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-recording-title"
        className="max-w-md w-full rounded-2xl border border-border bg-white shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="delete-recording-title" className="text-lg font-serif text-foreground">
          Delete process recording?
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          This will permanently remove the session on{' '}
          <span className="font-medium text-foreground">{sessionDateToInput(session.sessionDate)}</span> led by{' '}
          <span className="font-medium text-foreground">{session.socialWorker}</span>. This cannot be undone.
        </p>
        {error ? <p className="text-xs text-destructive mt-3">{error}</p> : null}
        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void confirmDelete()}
            className="px-4 py-2 text-sm rounded-md bg-destructive text-destructive-foreground hover:opacity-90 disabled:opacity-50"
          >
            {busy ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function NewEntryModal({
  onClose,
  residents,
  defaultResidentId,
  onCreated,
}: {
  onClose: () => void;
  residents: { residentId: number; caseControlNo: string }[];
  defaultResidentId: number | null;
  onCreated: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [residentId, setResidentId] = useState<number>(() => {
    const first = residents[0]?.residentId ?? 0;
    return defaultResidentId ?? first;
  });
  const [sessionDate, setSessionDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [socialWorker, setSocialWorker] = useState('');
  const [sessionType, setSessionType] = useState<'Individual' | 'Group'>('Individual');
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(45);
  const [emotionalStateObserved, setEmotionalStateObserved] = useState<
    'Calm' | 'Anxious' | 'Sad' | 'Angry' | 'Hopeful' | 'Withdrawn' | 'Happy' | 'Distressed'
  >('Calm');
  const [emotionalStateEnd, setEmotionalStateEnd] = useState<
    'Calm' | 'Anxious' | 'Sad' | 'Angry' | 'Hopeful' | 'Withdrawn' | 'Happy' | 'Distressed'
  >('Calm');
  const [sessionNarrative, setSessionNarrative] = useState('');
  const [interventionsApplied, setInterventionsApplied] = useState('');
  const [followUpActions, setFollowUpActions] = useState('');
  const [progressNoted, setProgressNoted] = useState(false);
  const [concernsFlagged, setConcernsFlagged] = useState(false);
  const [referralMade, setReferralMade] = useState(false);
  const [notesRestricted, setNotesRestricted] = useState<string>('');

  const canSubmit =
    residentId > 0 &&
    !!sessionDate &&
    socialWorker.trim().length > 0 &&
    sessionDurationMinutes > 0 &&
    sessionNarrative.trim().length > 0 &&
    interventionsApplied.trim().length > 0 &&
    followUpActions.trim().length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || saving) return;
    setSaving(true);
    setError(null);

    const payload: CreateProcessRecordingRequest = {
      residentId,
      sessionDate,
      socialWorker: socialWorker.trim(),
      sessionType,
      sessionDurationMinutes,
      emotionalStateObserved,
      emotionalStateEnd,
      sessionNarrative: sessionNarrative.trim(),
      interventionsApplied: interventionsApplied.trim(),
      followUpActions: followUpActions.trim(),
      progressNoted,
      concernsFlagged,
      referralMade,
      notesRestricted: notesRestricted.trim() ? notesRestricted.trim() : null,
    };

    const res = await apiPost<CreateProcessRecordingRequest, unknown>('/api/ProcessRecordings', payload);
    setSaving(false);
    if (res.data !== null) {
      onCreated();
    } else {
      setError(res.error ?? 'Could not save process recording');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/35 backdrop-blur-[2px] flex items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full h-[100svh] sm:h-auto sm:max-w-3xl sm:max-h-[90svh] overflow-hidden sm:overflow-y-auto rounded-none sm:rounded-3xl border border-border bg-white shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif text-foreground">New Process Recording</h2>
            <p className="text-xs text-muted-foreground mt-1">
              This will create a new process recording for the selected resident.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full border border-border hover:bg-background transition-colors grid place-items-center"
            aria-label="Close process recording modal"
          >
            <span className="text-lg leading-none text-foreground">×</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-5">
            {error ? <p className="text-xs text-destructive mb-3">{error}</p> : null}

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">Resident</label>
              <select
                className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-border bg-background"
                value={residentId}
                onChange={(e) => setResidentId(Number(e.target.value))}
              >
                {residents.map((r) => (
                  <option key={r.residentId} value={r.residentId}>
                    {r.caseControlNo}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">Session date</label>
              <input
                type="date"
                className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-border bg-background"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
              />
            </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">Social worker</label>
              <input
                className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-border bg-background"
                value={socialWorker}
                onChange={(e) => setSocialWorker(e.target.value)}
                placeholder="Name"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">Session type</label>
              <select
                className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-border bg-background"
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value as 'Individual' | 'Group')}
              >
                <option value="Individual">Individual</option>
                <option value="Group">Group</option>
              </select>
            </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">Duration (min)</label>
              <input
                type="number"
                min={1}
                className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-border bg-background"
                value={sessionDurationMinutes}
                onChange={(e) => setSessionDurationMinutes(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">Emotional state (start)</label>
              <select
                className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-border bg-background"
                value={emotionalStateObserved}
                onChange={(e) => setEmotionalStateObserved(e.target.value as typeof emotionalStateObserved)}
              >
                {['Calm', 'Anxious', 'Sad', 'Angry', 'Hopeful', 'Withdrawn', 'Happy', 'Distressed'].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">Emotional state (end)</label>
              <select
                className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-border bg-background"
                value={emotionalStateEnd}
                onChange={(e) => setEmotionalStateEnd(e.target.value as typeof emotionalStateEnd)}
              >
                {['Calm', 'Anxious', 'Sad', 'Angry', 'Hopeful', 'Withdrawn', 'Happy', 'Distressed'].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
              </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-muted-foreground">Session narrative</label>
            <textarea
              rows={3}
              className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-border bg-background"
              value={sessionNarrative}
              onChange={(e) => setSessionNarrative(e.target.value)}
            />
              </div>
              <div>
            <label className="text-xs uppercase tracking-wide text-muted-foreground">Interventions applied</label>
            <textarea
              rows={2}
              className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-border bg-background"
              value={interventionsApplied}
              onChange={(e) => setInterventionsApplied(e.target.value)}
              placeholder="e.g., CBT; grounding; art therapy"
            />
              </div>
              <div>
            <label className="text-xs uppercase tracking-wide text-muted-foreground">Follow up actions</label>
            <textarea
              rows={2}
              className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-border bg-background"
              value={followUpActions}
              onChange={(e) => setFollowUpActions(e.target.value)}
            />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={progressNoted}
                onChange={(e) => setProgressNoted(e.target.checked)}
              />
              Progress noted
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={concernsFlagged}
                onChange={(e) => setConcernsFlagged(e.target.checked)}
              />
              Concerns flagged
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={referralMade}
                onChange={(e) => setReferralMade(e.target.checked)}
              />
              Referral made
            </label>
              </div>

              <div>
            <label className="text-xs uppercase tracking-wide text-muted-foreground">Notes restricted (optional)</label>
            <textarea
              rows={2}
              className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-border bg-background"
              value={notesRestricted}
              onChange={(e) => setNotesRestricted(e.target.value)}
              placeholder="Restricted-access notes…"
            />
              </div>

            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-border px-4 sm:px-6 py-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || saving}
              className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
