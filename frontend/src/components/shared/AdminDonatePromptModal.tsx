export default function AdminDonatePromptModal({
  open,
  busy,
  error,
  onClose,
  onLoginAsDonor,
}: {
  open: boolean;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onLoginAsDonor: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={() => !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-donate-title"
        className="w-full max-w-md rounded-2xl border border-border bg-white shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="admin-donate-title" className="text-xl font-serif text-foreground">
          Donate as a donor account
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          To make personal donations, please log out and log in or register as a donor.
        </p>
        {error ? (
          <p className="mt-3 text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-60"
          >
            Close
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onLoginAsDonor}
            className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {busy ? 'Signing out…' : 'Login as donor'}
          </button>
        </div>
      </div>
    </div>
  );
}

