import type { ResidentStatus } from '@/hooks/useMockData';

interface StatusBadgeProps {
  status: ResidentStatus;
}

const statusStyles: Record<ResidentStatus, string> = {
  Active: 'sh-status-active',
  'In Progress': 'sh-status-progress',
  Reintegrated: 'sh-status-reintegrated',
  'At Risk': 'sh-status-risk',
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
