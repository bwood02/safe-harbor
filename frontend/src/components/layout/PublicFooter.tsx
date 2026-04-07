export function PublicFooter() {
  return (
    <footer className="border-t border-sh-mist-deep/60 bg-sh-mist/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-xs text-sh-muted">
        <div>
          <div className="font-black uppercase tracking-tight text-sh-deep">Safe Harbor</div>
          <p className="mt-2">© 2026 Safe Harbor. Healing happens in safe spaces.</p>
        </div>
        <div className="flex flex-wrap gap-4 font-semibold uppercase tracking-wide">
          <span>Privacy Policy</span>
          <span>Annual Report</span>
          <span>Contact Support</span>
          <span>Safe Exit</span>
        </div>
      </div>
    </footer>
  )
}
