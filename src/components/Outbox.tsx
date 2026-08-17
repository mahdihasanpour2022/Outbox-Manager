import { useEffect, useMemo, useRef } from 'react';
import { useStableListFocus } from '../hooks/useStableListFocus';
import { useOutboxStore } from '../outbox/outboxStore';
import { compareMessages } from '../outbox/selectors';
import { outboxScheduler } from '../outbox/scheduler';
import type { OutboxActivity } from '../outbox/types';
import type { Message } from '../types/message';
import MessageItem from './MessageItem';

export default function Outbox() {
  const messages = useOutboxStore((state) => state.messages);
  const selectedIds = useOutboxStore((state) => state.selectedIds);
  const toggleSelection = useOutboxStore((state) => state.toggleSelection);
  const selectAllPending = useOutboxStore((state) => state.selectAllPending);
  const clearSelection = useOutboxStore((state) => state.clearSelection);
  const requestSelectedSend = useOutboxStore(
    (state) => state.requestSelectedSend,
  );
  const requestRetry = useOutboxStore((state) => state.requestRetry);
  const lastActivity = useOutboxStore((state) => state.lastActivity);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const outboxTitleRef = useRef<HTMLHeadingElement>(null);

  const orderedMessages = useMemo(
    () => [...messages].sort(compareMessages),
    [messages],
  );
  const pendingIds = useMemo(
    () => messages
      .filter((message) => message.status === 'pending')
      .map((message) => message.id),
    [messages],
  );
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const orderedMessageIds = useMemo(
    () => orderedMessages.map((message) => message.id),
    [orderedMessages],
  );
  const listFocus = useStableListFocus({
    itemIds: orderedMessageIds,
    fallbackFocusRef: outboxTitleRef,
  });
  const selectedPendingCount = pendingIds.filter((id) =>
    selectedIdSet.has(id),
  ).length;
  const allPendingSelected =
    pendingIds.length > 0 && selectedPendingCount === pendingIds.length;
  const partiallySelected = selectedPendingCount > 0 && !allPendingSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = partiallySelected;
    }
  }, [partiallySelected]);

  const handleSelectAll = () => {
    if (allPendingSelected) clearSelection();
    else selectAllPending();
  };

  const liveAnnouncement = getActivityAnnouncement(lastActivity, messages);

  return (
    <section className="min-w-0 self-start overflow-hidden rounded-3xl border border-slate-200/90 bg-white/90 shadow-[0_24px_70px_rgba(22,46,39,0.08)] backdrop-blur" aria-labelledby="outbox-title">
      <header className="flex min-h-[107px] flex-col items-stretch justify-between gap-5 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:p-6">
        <div>
          <p className="mb-2 text-[0.7rem] font-bold tracking-[0.13em] text-emerald-700 uppercase">Your outbox</p>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800 focus-visible:rounded focus-visible:outline-3 focus-visible:outline-blue-500/40" ref={outboxTitleRef} id="outbox-title" tabIndex={-1}>Messages</h2>
            <span className="grid h-6 min-w-6 place-items-center rounded-full bg-emerald-50 px-1.5 text-xs font-bold text-emerald-700">{messages.length}</span>
          </div>
        </div>
        <button
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-700/20 transition hover:-translate-y-px hover:bg-emerald-800 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-500/40 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none motion-reduce:transform-none motion-reduce:transition-none sm:w-auto"
          type="button"
          disabled={selectedPendingCount === 0}
          onClick={requestSelectedSend}
        >
          <svg className="size-[18px] fill-none stroke-current stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
          Send selected{selectedPendingCount > 0 ? ` (${selectedPendingCount})` : ''}
        </button>
      </header>

      {messages.length === 0 ? (
        <div className="flex min-h-[430px] flex-col items-center justify-center px-8 py-10 text-center">
          <div className="mb-5 grid size-[70px] place-items-center rounded-2xl bg-emerald-50 text-emerald-700 shadow-xl shadow-emerald-800/10" aria-hidden="true">
            <svg className="size-8 fill-none stroke-current stroke-[1.6] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" focusable="false">
              <path d="M4 4h16v16H4z" />
              <path d="M4 13h4l2 3h4l2-3h4" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-800">Ready for your first message</h3>
          <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">Messages you compose will wait safely here until you send them.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-600 sm:px-6">
            <label className="inline-flex cursor-pointer items-center gap-2 font-semibold has-disabled:cursor-not-allowed has-disabled:opacity-50">
              <input
                ref={selectAllRef}
                type="checkbox"
                checked={allPendingSelected}
                disabled={pendingIds.length === 0}
                className="size-[17px] cursor-pointer rounded accent-emerald-700 disabled:cursor-not-allowed"
                onChange={handleSelectAll}
              />
              <span>Select all pending</span>
            </label>
            <span className="text-slate-500" aria-live="polite">
              {selectedPendingCount === 0
                ? `${pendingIds.length} available`
                : `${selectedPendingCount} selected`}
            </span>
            <span className="ml-auto hidden items-center gap-1 whitespace-nowrap text-slate-400 sm:inline-flex" aria-hidden="true">
              <kbd className="grid size-5 place-items-center rounded border border-slate-300 bg-white font-sans font-bold text-slate-500 shadow-[0_1px_0_#cbd5e1]">↑</kbd>
              <kbd className="grid size-5 place-items-center rounded border border-slate-300 bg-white font-sans font-bold text-slate-500 shadow-[0_1px_0_#cbd5e1]">↓</kbd> move
            </span>
          </div>

          <ul
            ref={listFocus.listRef}
            className="grid max-h-[640px] list-none gap-2.5 overflow-y-auto p-2.5 [scrollbar-color:#bdccc7_transparent] [scrollbar-width:thin] sm:p-3"
            aria-label="Outbox messages"
          >
            {orderedMessages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                selected={selectedIdSet.has(message.id)}
                onToggleSelection={toggleSelection}
                onCancel={(messageId) => {
                  outboxScheduler.cancel(messageId);
                }}
                onRetry={requestRetry}
                rowRef={listFocus.registerRow(message.id)}
                rowTabIndex={listFocus.activeId === message.id ? 0 : -1}
                onRowFocus={() => listFocus.handleFocusCapture(message.id)}
                onRowBlur={listFocus.handleBlurCapture}
                onRowKeyDown={(event) =>
                  listFocus.handleRowKeyDown(
                    message.id,
                    event,
                    () => toggleSelection(message.id),
                    message.status === 'pending',
                  )
                }
              />
            ))}
          </ul>
        </>
      )}
      <p
        key={lastActivity?.sequence ?? 0}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {liveAnnouncement}
      </p>
    </section>
  );
}

function getActivityAnnouncement(
  activity: OutboxActivity | null,
  messages: Message[],
): string {
  if (!activity) return '';

  const message = messages.find((candidate) => candidate.id === activity.messageId);
  if (!message) return '';

  switch (activity.type) {
    case 'send-started':
      return `Sending "${message.subject}" to ${message.recipient}.`;
    case 'send-succeeded':
      return `"${message.subject}" was delivered.`;
    case 'send-failed':
      return `"${message.subject}" failed. Later messages to ${message.recipient} are paused.`;
    case 'send-cancelled':
      return `Sending cancelled. "${message.subject}" returned to pending.`;
    case 'retry-requested':
      return `Retrying "${message.subject}" to ${message.recipient}.`;
  }
}
