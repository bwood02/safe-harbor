import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Records that the user saw the necessary-cookie notice (not used for analytics or profiling).
 * Version bump when copy or legal basis text changes so users can see updates once.
 */
const NOTICE_STORAGE_KEY = 'safeHarbor_necessaryCookieNotice_v1';
const NOTICE_VERSION = 1;

type StoredAcknowledgment = {
  v: number;
  acknowledgedAt: string;
};

function readAcknowledged(): boolean {
  try {
    const raw = localStorage.getItem(NOTICE_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as StoredAcknowledgment;
    return (
      parsed.v === NOTICE_VERSION &&
      typeof parsed.acknowledgedAt === 'string' &&
      parsed.acknowledgedAt.length > 0
    );
  } catch {
    return false;
  }
}

function writeAcknowledgment(): void {
  const payload: StoredAcknowledgment = {
    v: NOTICE_VERSION,
    acknowledgedAt: new Date().toISOString(),
  };
  localStorage.setItem(NOTICE_STORAGE_KEY, JSON.stringify(payload));
}

function CookieBanner() {
  const [visible, setVisible] = useState(() => !readAcknowledged());

  const acknowledge = useCallback(() => {
    try {
      writeAcknowledgment();
    } catch {
      // Still close if storage is blocked (e.g. strict private mode).
    }
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') acknowledge();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [visible, acknowledge]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto overscroll-y-contain bg-black/50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-sm sm:p-6"
      role="presentation"
      onClick={acknowledge}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-notice-title"
        aria-describedby="cookie-notice-description"
        className="my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col rounded-2xl border border-border bg-background p-6 text-foreground shadow-xl md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="cookie-notice-title" className="mb-1 shrink-0 font-serif text-xl font-semibold">
          Cookies used for sign-in
        </h2>
        <p id="cookie-notice-description" className="mb-4 text-xs text-muted-foreground">
          This notice covers strictly necessary cookies only. We do not ask for consent to use
          them because they are required for the service you request (staying signed in). Details
          below; see also our{' '}
          <Link
            to="/privacy"
            className="text-primary underline underline-offset-2 hover:opacity-90"
          >
            Privacy Policy
          </Link>
          .
        </p>

        <div className="max-h-[min(24rem,max(0px,calc(100dvh-13rem)))] min-h-0 space-y-3 overflow-y-auto overscroll-contain pr-1 text-sm leading-relaxed text-muted-foreground [-webkit-overflow-scrolling:touch] sm:max-h-[min(28rem,max(0px,calc(100dvh-14rem)))]">
          <p>
            <span className="font-medium text-foreground">Authentication only.</span> When you log
            in, we place a first-party, HTTP-only cookie so our server can recognize your session.
            We do not use cookies for advertising, analytics, or cross-site tracking.
          </p>
          <p>
            <span className="font-medium text-foreground">If you are not logged in,</span> we do
            not set this authentication cookie. Browsing public pages without signing in does not use
            cookie-based tracking on our site.
          </p>
          <p>
            <span className="font-medium text-foreground">How long it lasts.</span> The cookie is
            removed when you log out. While you remain signed in, it may stay valid for up to{' '}
            <span className="text-foreground">7 days</span> between visits (it can extend when you
            use the site). After logout, it is not kept for sign-in purposes.
          </p>
          <p>
            <span className="font-medium text-foreground">What we do not do.</span> We do not use
            cookies to build a marketing profile or to follow you across other websites. No other
            personal data is collected through cookies beyond what is needed to keep you
            authenticated.
          </p>
          <p className="border-t border-border pt-3 text-xs">
            <span className="font-medium text-foreground">Remembering that you read this.</span>{' '}
            We store a small entry in your browser&apos;s local storage (not the sign-in cookie)
            with the time you acknowledged this notice and a version number, only so we do not show
            this dialog every time. It is not used for tracking or profiling. You can clear it by
            clearing site data for this website.
          </p>
        </div>

        <div className="mt-6 flex shrink-0 flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            By continuing, you acknowledge this information.
          </p>
          <button
            type="button"
            onClick={acknowledge}
            className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}

export default CookieBanner;
