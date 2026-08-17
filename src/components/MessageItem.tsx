import type { Message } from '../types/message';
import StatusBadge from './StatusBadge';

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

interface MessageItemProps {
  message: Message;
  selected: boolean;
  onToggleSelection: (messageId: string) => void;
}

export default function MessageItem({
  message,
  selected,
  onToggleSelection,
}: MessageItemProps) {
  const isSelectable = message.status === 'pending';
  const createdAt = new Date(message.createdAt);
  const selectionLabel = `Select “${message.subject}” for ${message.recipient}`;

  return (
    <li className={`message-item ${selected ? 'is-selected' : ''}`}>
      <div className="message-select">
        <input
          id={`select-${message.id}`}
          type="checkbox"
          checked={selected}
          disabled={!isSelectable}
          aria-label={selectionLabel}
          onChange={() => onToggleSelection(message.id)}
        />
      </div>

      <div className="message-content">
        <div className="message-topline">
          <div className="recipient-line">
            <span className="recipient-avatar" aria-hidden="true">
              {message.recipient.trim().charAt(0).toUpperCase() || '?'}
            </span>
            <span className="recipient-name">{message.recipient}</span>
          </div>
          <StatusBadge status={message.status} />
        </div>

        <h3>{message.subject}</h3>
        <p className="message-body">{message.body}</p>

        <footer className="message-meta">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          <span>Written </span>
          <time dateTime={createdAt.toISOString()} title={createdAt.toLocaleString()}>
            {dateTimeFormatter.format(createdAt)}
          </time>
        </footer>
      </div>
    </li>
  );
}
