import type { Priority } from '../../types';

const config: Record<NonNullable<Priority>, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-emerald-900/50 text-emerald-400' },
  medium: { label: 'Medium', className: 'bg-amber-900/50 text-amber-400' },
  high: { label: 'High', className: 'bg-red-900/50 text-red-400' },
};

export default function PriorityBadge({ priority }: { priority: Priority }) {
  if (!priority) return null;
  const { label, className } = config[priority];
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${className}`}>{label}</span>
  );
}
