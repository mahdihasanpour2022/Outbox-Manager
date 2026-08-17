import type { MessageStatus } from '../types/message';

const STATUS_LABELS: Record<MessageStatus, string> = {
  pending: 'Pending',
  sending: 'Sending',
  delivered: 'Delivered',
  failed: 'Failed',
};

interface StatusBadgeProps {
  status: MessageStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-${status}`}>
      <span className="status-dot" aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}
