import type { ResidentStatus } from '@/hooks/useMockData';

interface StatusBadgeProps {
  status: ResidentStatus;
}

const statusStyles: Record<ResidentStatus, string> = {
  Active: 'bg-[#f4ebe6] text-[#8e4a59] border border-[#ebd7d9]',
  'In Progress': 'bg-[#eef2f6] text-[#4a5f78] border border-[#dce4ee]',
  Reintegrated: 'bg-[#eef5ef] text-[#426b52] border border-[#dce8e0]',
  'At Risk': 'bg-[#fbf4eb] text-[#9b6a35] border border-[#f2e5d5]',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full
        text-[11px] font-bold uppercase tracking-wider
        ${statusStyles[status]}
      `}
      aria-label={`Status: ${status}`}
    >
      {status}
    </span>
  );
}
