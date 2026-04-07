import type { ResidentStatus } from '../../types/resident'

const styles: Record<ResidentStatus, string> = {
  ACTIVE: 'bg-sh-deep text-white border-sh-deep',
  PENDING: 'bg-sh-mist text-sh-deep border-sh-mist-deep/60',
  ARCHIVED: 'bg-sh-subtle text-white border-sh-muted',
}

export function StatusBadge({ status }: { status: ResidentStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${styles[status]}`}
    >
      {status}
    </span>
  )
}
