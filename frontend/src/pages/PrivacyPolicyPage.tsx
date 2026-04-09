function PrivacyPolicyPage() {
  return (
    <div className="min-h-[calc(100svh-72px)] bg-background py-8 md:py-10">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          {/* Header */}
          <div className="mb-8 rounded-3xl border border-border/70 bg-white px-6 py-7 text-center shadow-sm md:mb-10 md:px-8">
            <h1 className="mb-3 font-serif text-[clamp(2rem,4.5vw,3rem)] font-semibold text-foreground">
              Privacy Policy
            </h1>
            <p className="mb-1 font-sans text-sm text-muted-foreground">
              Effective Date: April 9, 2026
            </p>
            <p className="mx-auto mt-4 max-w-2xl font-sans text-base leading-7 text-foreground">
              We value your privacy and are committed to protecting your personal
              information. This policy explains how we collect, use, and safeguard your data.
            </p>
          </div>

          {/* Content */}
          <div className="rounded-3xl border border-border/70 bg-white p-5 shadow-sm md:p-8">
            <section className="mb-7 border-b border-border/50 pb-7 last:mb-0 last:border-b-0 last:pb-0">
              <h2 className="mb-3 font-serif text-[clamp(1.4rem,2.8vw,1.9rem)] font-semibold text-foreground">
                1. Information We Collect
              </h2>
              <ul className="list-disc space-y-2 pl-5 font-sans text-base leading-7 text-foreground">
                <li>Email address and account credentials</li>
                <li>Authentication and session data</li>
                <li>User roles (Admin, Staff, Donor)</li>
                <li>Basic technical data (browser/device)</li>
              </ul>
            </section>

            <section className="mb-7 border-b border-border/50 pb-7 last:mb-0 last:border-b-0 last:pb-0">
              <h2 className="mb-3 font-serif text-[clamp(1.4rem,2.8vw,1.9rem)] font-semibold text-foreground">
                2. How We Collect Information
              </h2>
              <ul className="list-disc space-y-2 pl-5 font-sans text-base leading-7 text-foreground">
                <li>When you register for an account</li>
                <li>When you log in and use the platform</li>
                <li>When interacting with application features</li>
                <li>Through cookies and browser storage</li>
              </ul>
            </section>

            <section className="mb-7 border-b border-border/50 pb-7 last:mb-0 last:border-b-0 last:pb-0">
              <h2 className="mb-3 font-serif text-[clamp(1.4rem,2.8vw,1.9rem)] font-semibold text-foreground">
                3. How We Use Information
              </h2>
              <ul className="list-disc space-y-2 pl-5 font-sans text-base leading-7 text-foreground">
                <li>Provide and maintain our services</li>
                <li>Authenticate users and manage accounts</li>
                <li>Enforce role-based access control</li>
                <li>Protect against unauthorized access</li>
                <li>Improve user experience and performance</li>
              </ul>
            </section>

            <section className="mb-7 border-b border-border/50 pb-7 last:mb-0 last:border-b-0 last:pb-0">
              <h2 className="mb-3 font-serif text-[clamp(1.4rem,2.8vw,1.9rem)] font-semibold text-foreground">
                4. Legal Basis for Processing
              </h2>
              <ul className="list-disc space-y-2 pl-5 font-sans text-base leading-7 text-foreground">
                <li>
                  <strong>Contract:</strong> to provide access to your account
                </li>
                <li>
                  <strong>Legitimate Interest:</strong> to maintain security and improve services
                </li>
                <li>
                  <strong>Consent:</strong> for cookies and optional features
                </li>
              </ul>
            </section>

            <section className="mb-7 border-b border-border/50 pb-7 last:mb-0 last:border-b-0 last:pb-0">
              <h2 className="mb-3 font-serif text-[clamp(1.4rem,2.8vw,1.9rem)] font-semibold text-foreground">
                5. Cookies
              </h2>
              <p className="font-sans text-base leading-7 text-foreground">
                We use cookies to maintain login sessions and remember user preferences.
                A cookie consent notification is displayed when you first visit the site.
              </p>
            </section>

            <section className="mb-7 border-b border-border/50 pb-7 last:mb-0 last:border-b-0 last:pb-0">
              <h2 className="mb-3 font-serif text-[clamp(1.4rem,2.8vw,1.9rem)] font-semibold text-foreground">
                6. Data Protection
              </h2>
              <ul className="list-disc space-y-2 pl-5 font-sans text-base leading-7 text-foreground">
                <li>HTTPS encryption for all data in transit</li>
                <li>Secure authentication and identity management</li>
                <li>Role-based authorization</li>
                <li>Security headers to protect against common attacks</li>
              </ul>
            </section>

            <section className="mb-7 border-b border-border/50 pb-7 last:mb-0 last:border-b-0 last:pb-0">
              <h2 className="mb-3 font-serif text-[clamp(1.4rem,2.8vw,1.9rem)] font-semibold text-foreground">
                7. Third-Party Services
              </h2>
              <p className="font-sans text-base leading-7 text-foreground">
                We may use third-party services such as authentication providers (e.g., Google)
                or hosting platforms. These services only process the data necessary to operate the platform.
              </p>
            </section>

            <section className="mb-7 border-b border-border/50 pb-7 last:mb-0 last:border-b-0 last:pb-0">
              <h2 className="mb-3 font-serif text-[clamp(1.4rem,2.8vw,1.9rem)] font-semibold text-foreground">
                8. Data Retention
              </h2>
              <p className="font-sans text-base leading-7 text-foreground">
                We retain personal data only as long as necessary to operate the platform
                and comply with legal obligations. Data is deleted when no longer needed.
              </p>
            </section>

            <section className="mb-7 border-b border-border/50 pb-7 last:mb-0 last:border-b-0 last:pb-0">
              <h2 className="mb-3 font-serif text-[clamp(1.4rem,2.8vw,1.9rem)] font-semibold text-foreground">
                9. Your Rights
              </h2>
              <ul className="list-disc space-y-2 pl-5 font-sans text-base leading-7 text-foreground">
                <li>Access your personal data</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Restrict or object to processing</li>
                <li>Request transfer of your data</li>
              </ul>
            </section>

            <section className="mb-7 border-b border-border/50 pb-7 last:mb-0 last:border-b-0 last:pb-0">
              <h2 className="mb-3 font-serif text-[clamp(1.4rem,2.8vw,1.9rem)] font-semibold text-foreground">
                10. Policy Updates
              </h2>
              <p className="font-sans text-base leading-7 text-foreground">
                We may update this privacy policy periodically. Updates will be posted on this page.
              </p>
            </section>

            <section className="pt-2">
              <h2 className="mb-3 font-serif text-[clamp(1.4rem,2.8vw,1.9rem)] font-semibold text-foreground">
                11. Contact
              </h2>
              <p className="font-sans text-base leading-7 text-foreground">
                For questions about this policy, contact us at{' '}
                <a
                  href="mailto:support@example.com"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  support@example.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicyPage;
