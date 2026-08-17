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
    <section className="outbox-card" aria-labelledby="outbox-title">
      <header className="outbox-heading">
        <div>
          <p className="eyebrow">Your outbox</p>
          <div className="outbox-title-row">
            <h2 ref={outboxTitleRef} id="outbox-title" tabIndex={-1}>Messages</h2>
            <span className="count-badge">{messages.length}</span>
          </div>
        </div>
        <button
          className="button button-primary send-button"
          type="button"
          disabled={selectedPendingCount === 0}
          onClick={requestSelectedSend}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
          Send selected{selectedPendingCount > 0 ? ` (${selectedPendingCount})` : ''}
        </button>
      </header>

      {messages.length === 0 ? (
        <div className="empty-outbox">
          <div className="empty-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M4 4h16v16H4z" />
              <path d="M4 13h4l2 3h4l2-3h4" />
            </svg>
          </div>
          <h3>Ready for your first message</h3>
          <p>Messages you compose will wait safely here until you send them.</p>
        </div>
      ) : (
        <>
          <div className="selection-bar">
            <label className="select-all">
              <input
                ref={selectAllRef}
                type="checkbox"
                checked={allPendingSelected}
                disabled={pendingIds.length === 0}
                onChange={handleSelectAll}
              />
              <span>Select all pending</span>
            </label>
            <span className="selection-summary" aria-live="polite">
              {selectedPendingCount === 0
                ? `${pendingIds.length} available`
                : `${selectedPendingCount} selected`}
            </span>
            <span className="keyboard-hint" aria-hidden="true">
              <kbd>↑</kbd><kbd>↓</kbd> move
            </span>
          </div>

          <ul
            ref={listFocus.listRef}
            className="message-list"
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
