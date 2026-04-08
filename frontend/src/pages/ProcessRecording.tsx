import { useMemo, useState } from 'react';
import StaffHeader from '@/components/shared/StaffHeader';
import PublicFooter from '@/components/shared/PublicFooter';
import {
  useResidentsForPicker,
  useProcessRecordings,
  type ProcessRecordingSession,
} from '@/hooks/useProcessRecording';

export default function ProcessRecordingPage() {
  const residents = useResidentsForPicker();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const effectiveId =
    selectedId ?? (residents.data && residents.data.length > 0 ? residents.data[0].residentId : null);

  const sessions = useProcessRecordings(effectiveId);

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
    <div className="min-h-screen bg-background flex flex-col">
      <StaffHeader />
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
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
                      onClick={() => setSelectedId(r.residentId)}
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

            {!sessions.loading && sessions.data && sessions.data.length === 0 && (
              <div className="p-12 text-center border border-dashed border-border rounded-lg">
                <p className="text-muted-foreground">
                  No process recordings yet for this resident.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {sessions.data?.map((s) => (
                <SessionCard key={s.recordingId} session={s} />
              ))}
            </div>

            {sessions.error && (
              <div className="mt-4 text-xs text-muted-foreground">
                Showing mock data — backend unavailable ({sessions.error}).
              </div>
            )}
          </section>
        </div>
      </main>

      {modalOpen && <NewEntryModal onClose={() => setModalOpen(false)} />}

      <PublicFooter />
    </div>
  );
}

function SessionCard({ session }: { session: ProcessRecordingSession }) {
  const interventions = session.interventionsApplied
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <article className="border border-border rounded-lg bg-card p-5">
      <header className="flex items-start justify-between mb-3">
        <div>
          <div className="font-serif text-lg text-foreground">{session.sessionDate}</div>
          <div className="text-sm text-muted-foreground">
            {session.socialWorker} · {session.sessionDurationMinutes} min
          </div>
        </div>
        <span className="px-2.5 py-1 text-xs rounded-full bg-secondary text-secondary-foreground">
          {session.sessionType}
        </span>
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

function NewEntryModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-lg max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-serif text-2xl text-foreground mb-1">New Process Recording</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Preview only — submission is disabled until auth is wired up.
        </p>

        <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="text-xs uppercase tracking-wide text-muted-foreground">
              Session Type
            </label>
            <select className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-border bg-background">
              <option>Individual</option>
              <option>Group</option>
              <option>Crisis</option>
              <option>Family</option>
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-muted-foreground">
              Narrative
            </label>
            <textarea
              rows={4}
              className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-border bg-background"
              placeholder="Session notes…"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled
              className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground opacity-50 cursor-not-allowed"
              title="Save disabled — preview only"
            >
              Save (disabled)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
