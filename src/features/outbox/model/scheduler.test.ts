import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initialOutboxState, useOutboxStore } from './outboxStore';
import { OutboxScheduler, type SendMessage } from './scheduler';

interface ControlledCall {
  messageId: string;
  signal?: AbortSignal;
  resolve: () => void;
  reject: (error: unknown) => void;
}

function createControlledTransport() {
  const calls: ControlledCall[] = [];
  const send: SendMessage = (messageId, signal) =>
    new Promise<void>((resolve, reject) => {
      calls.push({ messageId, signal, resolve, reject });
    });

  return { calls, send };
}

function compose(recipient: string, subject: string) {
  return useOutboxStore.getState().composeMessage({
    recipient,
    subject,
    body: `${subject} body`,
  });
}

function requestMessages(messageIds: string[]) {
  for (const messageId of messageIds) {
    useOutboxStore.getState().toggleSelection(messageId);
  }
  useOutboxStore.getState().requestSelectedSend();
}

describe('outbox delivery scheduler', () => {
  let scheduler: OutboxScheduler | null = null;

  beforeEach(() => {
    useOutboxStore.setState({ ...initialOutboxState });
  });

  afterEach(() => {
    scheduler?.stop();
    scheduler = null;
  });

  it('sends one message at a time per recipient in creation order', async () => {
    const transport = createControlledTransport();
    scheduler = new OutboxScheduler(useOutboxStore, transport.send);
    const first = compose('Alex', 'First');
    const second = compose('alex', 'Second');

    scheduler.start();
    requestMessages([second.id, first.id]);

    await vi.waitFor(() => expect(transport.calls).toHaveLength(1));
    expect(transport.calls[0].messageId).toBe(first.id);

    transport.calls[0].resolve();
    await vi.waitFor(() => expect(transport.calls).toHaveLength(2));
    expect(transport.calls[1].messageId).toBe(second.id);
    expect(useOutboxStore.getState().messages.find((item) => item.id === first.id)?.status).toBe('delivered');
  });

  it('starts different recipient lanes concurrently', async () => {
    const transport = createControlledTransport();
    scheduler = new OutboxScheduler(useOutboxStore, transport.send);
    const alex = compose('Alex', 'Alex message');
    const sam = compose('Sam', 'Sam message');

    scheduler.start();
    requestMessages([alex.id, sam.id]);

    await vi.waitFor(() => expect(transport.calls).toHaveLength(2));
    expect(new Set(transport.calls.map((call) => call.messageId))).toEqual(
      new Set([alex.id, sam.id]),
    );
  });

  it('pauses a failed recipient while another recipient continues', async () => {
    const transport = createControlledTransport();
    scheduler = new OutboxScheduler(useOutboxStore, transport.send);
    const first = compose('Alex', 'First');
    const second = compose('Alex', 'Second');
    const independent = compose('Sam', 'Independent');

    scheduler.start();
    requestMessages([first.id, second.id, independent.id]);
    await vi.waitFor(() => expect(transport.calls).toHaveLength(2));

    transport.calls.find((call) => call.messageId === first.id)?.reject(
      new Error('Network error'),
    );
    transport.calls.find((call) => call.messageId === independent.id)?.resolve();

    await vi.waitFor(() => {
      const state = useOutboxStore.getState();
      expect(state.messages.find((item) => item.id === first.id)?.status).toBe('failed');
      expect(state.messages.find((item) => item.id === independent.id)?.status).toBe('delivered');
    });
    expect(transport.calls.some((call) => call.messageId === second.id)).toBe(false);

    useOutboxStore.getState().requestRetry(first.id);
    await vi.waitFor(() => expect(transport.calls).toHaveLength(3));
    transport.calls[2].resolve();
    await vi.waitFor(() => expect(transport.calls).toHaveLength(4));
    expect(transport.calls[3].messageId).toBe(second.id);
  });

  it('cancels honestly and ignores a stale completion after retry', async () => {
    const transport = createControlledTransport();
    scheduler = new OutboxScheduler(useOutboxStore, transport.send);
    const message = compose('Alex', 'Cancelable');

    scheduler.start();
    requestMessages([message.id]);
    await vi.waitFor(() => expect(transport.calls).toHaveLength(1));

    expect(scheduler.cancel(message.id)).toBe(true);
    expect(transport.calls[0].signal?.aborted).toBe(true);
    expect(useOutboxStore.getState().messages[0].status).toBe('pending');

    requestMessages([message.id]);
    await vi.waitFor(() => expect(transport.calls).toHaveLength(2));
    transport.calls[0].resolve();
    await Promise.resolve();
    expect(useOutboxStore.getState().messages[0].status).toBe('sending');

    transport.calls[1].resolve();
    await vi.waitFor(() =>
      expect(useOutboxStore.getState().messages[0].status).toBe('delivered'),
    );
  });
});
