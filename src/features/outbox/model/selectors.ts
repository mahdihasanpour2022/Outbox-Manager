import type { Message } from '../../../types/message';
import type { OutboxState } from './types';

export function normalizeRecipient(recipient: string): string {
  return recipient.trim().toLowerCase();
}

export function compareMessages(left: Message, right: Message): number {
  return left.createdAt - right.createdAt || left.id.localeCompare(right.id);
}

export function selectOrderedMessages(state: OutboxState): Message[] {
  return [...state.messages].sort(compareMessages);
}

export function selectSelectableIds(state: OutboxState): string[] {
  return state.messages
    .filter((message) => message.status === 'pending')
    .sort(compareMessages)
    .map((message) => message.id);
}

export function selectRecipientLanes(
  state: OutboxState,
): ReadonlyMap<string, readonly Message[]> {
  const lanes = new Map<string, Message[]>();

  for (const message of selectOrderedMessages(state)) {
    const recipient = normalizeRecipient(message.recipient);
    const lane = lanes.get(recipient);

    if (lane) {
      lane.push(message);
    } else {
      lanes.set(recipient, [message]);
    }
  }

  return lanes;
}

export function selectNextEligibleMessages(state: OutboxState): Message[] {
  const requestedIds = new Set(state.requestedSendIds);
  const nextMessages: Message[] = [];

  for (const lane of selectRecipientLanes(state).values()) {
    if (lane.some((message) => message.status === 'sending')) continue;

    const firstUndelivered = lane.find(
      (message) => message.status !== 'delivered',
    );

    if (
      firstUndelivered?.status === 'pending' &&
      requestedIds.has(firstUndelivered.id)
    ) {
      nextMessages.push(firstUndelivered);
    }
  }

  return nextMessages.sort(compareMessages);
}

export function selectIsMessageSelectable(
  state: OutboxState,
  messageId: string,
): boolean {
  return state.messages.some(
    (message) => message.id === messageId && message.status === 'pending',
  );
}
