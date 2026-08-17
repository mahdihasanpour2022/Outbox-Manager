import type { MessageStatus } from '../types/message';

const STATUS_LABELS: Record<MessageStatus, string> = {
  pending: 'Pending',
  sending: 'Sending',
  delivered: 'Delivered',
  failed: 'Failed',
};

const STATUS_CLASSES: Record<MessageStatus, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  sending: 'border-sky-200 bg-sky-50 text-sky-800',
  delivered: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  failed: 'border-rose-200 bg-rose-50 text-rose-800',
};

interface StatusBadgeProps {
  status: MessageStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[0.67rem] leading-none font-bold ${STATUS_CLASSES[status]}`}>
      <span className={`size-1.5 rounded-full bg-current ${status === 'sending' ? 'animate-pulse motion-reduce:animate-none' : ''}`} aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}
