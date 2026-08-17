import type {
  FocusEvent,
  KeyboardEvent,
  RefCallback,
} from 'react';
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
  onCancel: (messageId: string) => void;
  onRetry: (messageId: string) => void;
  rowRef: RefCallback<HTMLLIElement>;
  rowTabIndex: number;
  onRowFocus: () => void;
  onRowBlur: (event: FocusEvent<HTMLLIElement>) => void;
  onRowKeyDown: (event: KeyboardEvent<HTMLLIElement>) => void;
}

export default function MessageItem({
  message,
  selected,
  onToggleSelection,
  onCancel,
  onRetry,
  rowRef,
  rowTabIndex,
  onRowFocus,
  onRowBlur,
  onRowKeyDown,
}: MessageItemProps) {
  const isSelectable = message.status === 'pending';
  const createdAt = new Date(message.createdAt);
  const selectionLabel = `Select "${message.subject}" for ${message.recipient}`;

  return (
    <li
      ref={rowRef}
      className={`message-item ${selected ? 'is-selected' : ''}`}
      tabIndex={rowTabIndex}
      aria-keyshortcuts="ArrowUp ArrowDown Home End Space"
      onFocusCapture={onRowFocus}
      onBlurCapture={onRowBlur}
      onKeyDown={onRowKeyDown}
    >
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

        {message.status === 'failed' && (
          <p className="failure-note">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M10.3 3.8 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" />
            </svg>
            Later messages to {message.recipient} are paused until this one is
            retried.
          </p>
        )}

        <footer className="message-footer">
          <div className="message-meta">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            <span>Written </span>
            <time dateTime={createdAt.toISOString()} title={createdAt.toLocaleString()}>
              {dateTimeFormatter.format(createdAt)}
            </time>
          </div>

          {message.status === 'sending' && (
            <button
              className="message-action cancel-action"
              type="button"
              aria-label={`Cancel sending "${message.subject}"`}
              onClick={() => onCancel(message.id)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
              Cancel
            </button>
          )}

          {message.status === 'failed' && (
            <button
              className="message-action retry-action"
              type="button"
              aria-label={`Retry sending "${message.subject}"`}
              onClick={() => onRetry(message.id)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M20 6v5h-5" />
                <path d="M19 11a8 8 0 1 0 1 5" />
              </svg>
              Retry
            </button>
          )}
        </footer>
      </div>
    </li>
  );
}
