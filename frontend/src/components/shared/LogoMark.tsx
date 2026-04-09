type LogoMarkProps = {
  className?: string;
  title?: string;
};

/**
 * Stylized line-art lighthouse on a dome/hill with a wave beneath.
 * Uses currentColor so it inherits from parent text color — set the color
 * via a Tailwind text-* class (e.g. text-primary).
 */
export default function LogoMark({ className, title = 'Safe Harbor' }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 200 220"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Dome / hill base */}
      <path d="M20 150 A80 72 0 0 1 180 150" />

      {/* Gallery deck line across dome */}
      <line x1="28" y1="158" x2="172" y2="158" />

      {/* Wave under the dome */}
      <path d="M10 182 Q40 170 70 182 T130 182 T190 182" strokeWidth="3" />

      {/* Tower body — tapered trapezoid */}
      <path d="M82 150 L82 68 L118 68 L118 150" />

      {/* Diagonal stripes inside tower */}
      <line x1="82" y1="140" x2="118" y2="112" />
      <line x1="82" y1="118" x2="118" y2="90" />
      <line x1="82" y1="96" x2="118" y2="68" />

      {/* Gallery above tower (platform) */}
      <line x1="78" y1="68" x2="122" y2="68" />

      {/* Lantern room (rectangular) */}
      <rect x="88" y="50" width="24" height="18" />

      {/* Lantern roof */}
      <path d="M85 50 L100 36 L115 50" />

      {/* Finial */}
      <line x1="100" y1="36" x2="100" y2="28" />
      <circle cx="100" cy="26" r="2" fill="currentColor" />
    </svg>
  );
}
