type QuestionTooltipProps = {
  label: string;
  text: string;
};

export default function QuestionTooltip({ label, text }: QuestionTooltipProps) {
  return (
    <span className="relative inline-flex group ml-1 align-middle">
      <span
        aria-label={label}
        tabIndex={0}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[10px] lowercase font-normal leading-none text-muted-foreground cursor-help"
      >
        ?
      </span>
      <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-max max-w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 rounded-md border border-border bg-white p-2 text-[11px] font-normal normal-case tracking-normal text-foreground shadow-sm opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {text}
      </span>
    </span>
  );
}
