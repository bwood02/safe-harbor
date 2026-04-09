import type { ReactNode } from 'react';

type InlineHoverTooltipProps = {
  text?: string;
  children: ReactNode;
};

export default function InlineHoverTooltip({ text, children }: InlineHoverTooltipProps) {
  if (!text) return <>{children}</>;

  return (
    <span className="relative inline-flex group align-middle">
      <span tabIndex={0}>{children}</span>
      <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-max max-w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 rounded-md border border-border bg-white p-2 text-[11px] font-normal normal-case tracking-normal text-foreground shadow-sm opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {text}
      </span>
    </span>
  );
}
