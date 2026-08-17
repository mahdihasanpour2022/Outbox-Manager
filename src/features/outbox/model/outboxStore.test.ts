import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initialOutboxState, useOutboxStore } from './outboxStore';
import { selectOrderedMessages } from './selectors';

const draft = {
  recipient: ' Alex ',
  subject: ' Status update ',
  body: '<strong>plain text</strong>\nSecond line',
};

describe('outbox domain store', () => {
  beforeEach(() => {
    useOutboxStore.setState({ ...initialOutboxState });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates normalized pending messages and preserves body text exactly', () => {
    const message = useOutboxStore.getState().composeMessage(draft);

    expect(message).toMatchObject({
      recipient: 'Alex',
      subject: 'Status update',
      body: '<strong>plain text</strong>\nSecond line',
      status: 'pending',
    });
    expect(useOutboxStore.getState().messages).toEqual([message]);
  });

  it('keeps creation order when messages are written in the same millisecond', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000);
    const first = useOutboxStore.getState().composeMessage(draft);
    const second = useOutboxStore.getState().composeMessage({
      ...draft,
      subject: 'Follow-up',
    });

    expect(second.createdAt).toBeGreaterThan(first.createdAt);
    expect(selectOrderedMessages(useOutboxStore.getState())).toEqual([
      first,
      second,
    ]);
  });

  it('guards send transitions and removes completed work from requested IDs', () => {
    const message = useOutboxStore.getState().composeMessage(draft);

    useOutboxStore.getState().markSendStarted(message.id);
    expect(useOutboxStore.getState().messages[0].status).toBe('pending');

    useOutboxStore.getState().toggleSelection(message.id);
    useOutboxStore.getState().requestSelectedSend();
    useOutboxStore.getState().markSendStarted(message.id);
    expect(useOutboxStore.getState().messages[0].status).toBe('sending');

    useOutboxStore.getState().markSendSucceeded(message.id);
    const state = useOutboxStore.getState();
    expect(state.messages[0].status).toBe('delivered');
    expect(state.requestedSendIds).not.toContain(message.id);

    state.markSendCancelled(message.id);
    expect(useOutboxStore.getState().messages[0].status).toBe('delivered');
  });

  it('returns a failed message to pending and requests a retry once', () => {
    const message = useOutboxStore.getState().composeMessage(draft);
    const actions = useOutboxStore.getState();

    actions.toggleSelection(message.id);
    actions.requestSelectedSend();
    actions.markSendStarted(message.id);
    actions.markSendFailed(message.id);
    useOutboxStore.getState().requestRetry(message.id);
    useOutboxStore.getState().requestRetry(message.id);

    const state = useOutboxStore.getState();
    expect(state.messages[0].status).toBe('pending');
    expect(state.requestedSendIds).toEqual([message.id]);
  });
});
