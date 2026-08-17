import { sendMessage } from '../api/messageApi';
import type { Message } from '../types/message';
import { useOutboxStore } from './outboxStore';
import {
  normalizeRecipient,
  selectNextEligibleMessages,
} from './selectors';
import type { OutboxStore } from './types';

export type SendMessage = (
  messageId: string,
  signal?: AbortSignal,
) => Promise<void>;

interface SchedulerStore {
  getState: () => OutboxStore;
  subscribe: (listener: (state: OutboxStore) => void) => () => void;
}

interface ActiveAttempt {
  token: symbol;
  messageId: string;
  recipientKey: string;
  controller: AbortController;
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'AbortError')
  );
}

export class OutboxScheduler {
  private readonly activeByRecipient = new Map<string, ActiveAttempt>();
  private readonly activeByMessage = new Map<string, ActiveAttempt>();
  private unsubscribe: (() => void) | null = null;
  private passQueued = false;

  constructor(
    private readonly store: SchedulerStore,
    private readonly send: SendMessage,
  ) {}

  start(): void {
    if (this.unsubscribe) return;

    this.unsubscribe = this.store.subscribe(() => this.queuePass());
    this.queuePass();
  }

  stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.passQueued = false;

    const attempts = [...this.activeByMessage.values()];
    this.activeByMessage.clear();
    this.activeByRecipient.clear();

    for (const attempt of attempts) {
      this.store.getState().markSendCancelled(attempt.messageId);
      attempt.controller.abort();
    }
  }

  cancel(messageId: string): boolean {
    const attempt = this.activeByMessage.get(messageId);
    if (!attempt) return false;

    this.release(attempt);
    this.store.getState().markSendCancelled(messageId);
    attempt.controller.abort();
    this.queuePass();
    return true;
  }

  isSending(messageId: string): boolean {
    return this.activeByMessage.has(messageId);
  }

  private queuePass(): void {
    if (!this.unsubscribe || this.passQueued) return;

    this.passQueued = true;
    queueMicrotask(() => {
      this.passQueued = false;
      if (this.unsubscribe) this.runPass();
    });
  }

  private runPass(): void {
    const eligibleMessages = selectNextEligibleMessages(this.store.getState());

    for (const message of eligibleMessages) {
      const recipientKey = normalizeRecipient(message.recipient);
      if (this.activeByRecipient.has(recipientKey)) continue;
      this.begin(message, recipientKey);
    }
  }

  private begin(message: Message, recipientKey: string): void {
    const attempt: ActiveAttempt = {
      token: Symbol(message.id),
      messageId: message.id,
      recipientKey,
      controller: new AbortController(),
    };

    this.activeByRecipient.set(recipientKey, attempt);
    this.activeByMessage.set(message.id, attempt);
    this.store.getState().markSendStarted(message.id);

    const currentMessage = this.store
      .getState()
      .messages.find((candidate) => candidate.id === message.id);

    if (currentMessage?.status !== 'sending') {
      this.release(attempt);
      return;
    }

    void this.send(message.id, attempt.controller.signal).then(
      () => this.settle(attempt, 'succeeded'),
      (error: unknown) =>
        this.settle(attempt, isAbortError(error) ? 'cancelled' : 'failed'),
    );
  }

  private settle(
    attempt: ActiveAttempt,
    result: 'succeeded' | 'failed' | 'cancelled',
  ): void {
    if (!this.isCurrent(attempt)) return;

    this.release(attempt);
    const actions = this.store.getState();

    if (result === 'succeeded') {
      actions.markSendSucceeded(attempt.messageId);
    } else if (result === 'failed') {
      actions.markSendFailed(attempt.messageId);
    } else {
      actions.markSendCancelled(attempt.messageId);
    }

    this.queuePass();
  }

  private isCurrent(attempt: ActiveAttempt): boolean {
    return (
      this.activeByMessage.get(attempt.messageId)?.token === attempt.token &&
      this.activeByRecipient.get(attempt.recipientKey)?.token === attempt.token
    );
  }

  private release(attempt: ActiveAttempt): void {
    if (this.activeByMessage.get(attempt.messageId)?.token === attempt.token) {
      this.activeByMessage.delete(attempt.messageId);
    }

    if (
      this.activeByRecipient.get(attempt.recipientKey)?.token === attempt.token
    ) {
      this.activeByRecipient.delete(attempt.recipientKey);
    }
  }
}

export const outboxScheduler = new OutboxScheduler(
  useOutboxStore,
  sendMessage,
);
