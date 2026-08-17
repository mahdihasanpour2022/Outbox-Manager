import type {
  FocusEvent,
  KeyboardEvent,
  RefCallback,
} from 'react';
import type { Message } from '../../../types/message';
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
      data-message-id={message.id}
      className={`grid grid-cols-[22px_minmax(0,1fr)] gap-3 rounded-2xl border p-3.5 transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-500/40 motion-reduce:transition-none sm:p-4 ${selected ? 'border-emerald-400 bg-emerald-50/60 shadow-[inset_3px_0_0_#047857,0_8px_24px_rgba(20,91,73,0.07)]' : 'border-slate-200 bg-white hover:border-slate-300'}`}
      tabIndex={rowTabIndex}
      aria-keyshortcuts="ArrowUp ArrowDown Home End Space"
      onFocusCapture={onRowFocus}
      onBlurCapture={onRowBlur}
      onKeyDown={onRowKeyDown}
    >
      <div className="pt-0.5">
        <input
          id={`select-${message.id}`}
          type="checkbox"
          checked={selected}
          disabled={!isSelectable}
          className="size-[17px] cursor-pointer rounded accent-emerald-700 disabled:cursor-not-allowed"
          aria-label={selectionLabel}
          onChange={() => onToggleSelection(message.id)}
        />
      </div>

      <div className="min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-emerald-50 text-xs font-extrabold text-emerald-800" aria-hidden="true">
              {message.recipient.trim().charAt(0).toUpperCase() || '?'}
            </span>
            <span className="truncate text-xs font-semibold text-slate-600">{message.recipient}</span>
          </div>
          <StatusBadge status={message.status} />
        </div>

        <h3 className="mt-3 mb-1.5 wrap-anywhere text-[0.95rem] leading-5 font-bold tracking-tight text-slate-800">{message.subject}</h3>
        <p className="m-0 wrap-anywhere whitespace-pre-wrap text-[0.82rem] leading-5 text-slate-500">{message.body}</p>

        {message.status === 'failed' && (
          <p className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs leading-5 text-rose-800">
            <svg className="mt-0.5 size-4 shrink-0 fill-none stroke-current stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M10.3 3.8 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" />
            </svg>
            Later messages to {message.recipient} are paused until this one is
            retried.
          </p>
        )}

        <footer className="mt-3 flex min-h-8 flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-1 text-[0.7rem] text-slate-400">
            <svg className="mr-0.5 size-3.5 fill-none stroke-current stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
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
              className="inline-flex min-h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-bold text-rose-700 transition hover:-translate-y-px hover:border-rose-300 hover:bg-rose-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-500/40 motion-reduce:transform-none motion-reduce:transition-none sm:w-auto"
              type="button"
              aria-label={`Cancel sending "${message.subject}"`}
              onClick={() => onCancel(message.id)}
            >
              <svg className="size-3.5 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
              Cancel
            </button>
          )}

          {message.status === 'failed' && (
            <button
              className="inline-flex min-h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-800 transition hover:-translate-y-px hover:border-emerald-400 hover:bg-emerald-100 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-500/40 motion-reduce:transform-none motion-reduce:transition-none sm:w-auto"
              type="button"
              aria-label={`Retry sending "${message.subject}"`}
              onClick={() => onRetry(message.id)}
            >
              <svg className="size-3.5 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
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
