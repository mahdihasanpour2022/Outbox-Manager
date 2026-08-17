import { create } from 'zustand';
import type { Message, MessageStatus } from '../types/message';
import { selectIsMessageSelectable } from './selectors';
import type {
  ComposeMessageInput,
  OutboxActions,
  OutboxState,
  OutboxStore,
} from './types';

export const initialOutboxState: OutboxState = {
  messages: [],
  selectedIds: [],
  requestedSendIds: [],
};

function replaceMessageStatus(
  messages: Message[],
  messageId: string,
  expectedStatus: MessageStatus,
  nextStatus: MessageStatus,
): Message[] {
  let didChange = false;

  const nextMessages = messages.map((message) => {
    if (message.id !== messageId || message.status !== expectedStatus) {
      return message;
    }

    didChange = true;
    return { ...message, status: nextStatus };
  });

  return didChange ? nextMessages : messages;
}

function withoutId(ids: string[], messageId: string): string[] {
  return ids.includes(messageId)
    ? ids.filter((id) => id !== messageId)
    : ids;
}

function addUnique(ids: string[], messageId: string): string[] {
  return ids.includes(messageId) ? ids : [...ids, messageId];
}

function createMessage(input: ComposeMessageInput): Message {
  return {
    id: crypto.randomUUID(),
    recipient: input.recipient.trim(),
    subject: input.subject.trim(),
    body: input.body,
    status: 'pending',
    createdAt: Date.now(),
  };
}

export const useOutboxStore = create<OutboxStore>()((set, get) => {
  const actions: OutboxActions = {
    composeMessage: (input) => {
      const message = createMessage(input);
      set((state) => ({ messages: [...state.messages, message] }));
      return message;
    },

    toggleSelection: (messageId) => {
      set((state) => {
        if (!selectIsMessageSelectable(state, messageId)) return state;

        return {
          selectedIds: state.selectedIds.includes(messageId)
            ? withoutId(state.selectedIds, messageId)
            : [...state.selectedIds, messageId],
        };
      });
    },

    clearSelection: () => {
      if (get().selectedIds.length > 0) set({ selectedIds: [] });
    },

    requestSelectedSend: () => {
      set((state) => {
        const eligibleIds = state.selectedIds.filter((messageId) =>
          selectIsMessageSelectable(state, messageId),
        );

        if (eligibleIds.length === 0) return state;

        return {
          requestedSendIds: Array.from(
            new Set([...state.requestedSendIds, ...eligibleIds]),
          ),
          selectedIds: state.selectedIds.filter(
            (messageId) => !eligibleIds.includes(messageId),
          ),
        };
      });
    },

    markSendStarted: (messageId) => {
      set((state) => {
        if (!state.requestedSendIds.includes(messageId)) return state;

        const messages = replaceMessageStatus(
          state.messages,
          messageId,
          'pending',
          'sending',
        );

        return messages === state.messages ? state : { messages };
      });
    },

    markSendSucceeded: (messageId) => {
      set((state) => {
        const messages = replaceMessageStatus(
          state.messages,
          messageId,
          'sending',
          'delivered',
        );

        if (messages === state.messages) return state;

        return {
          messages,
          requestedSendIds: withoutId(state.requestedSendIds, messageId),
          selectedIds: withoutId(state.selectedIds, messageId),
        };
      });
    },

    markSendFailed: (messageId) => {
      set((state) => {
        const messages = replaceMessageStatus(
          state.messages,
          messageId,
          'sending',
          'failed',
        );

        if (messages === state.messages) return state;

        return {
          messages,
          requestedSendIds: withoutId(state.requestedSendIds, messageId),
          selectedIds: withoutId(state.selectedIds, messageId),
        };
      });
    },

    markSendCancelled: (messageId) => {
      set((state) => {
        const messages = replaceMessageStatus(
          state.messages,
          messageId,
          'sending',
          'pending',
        );

        if (messages === state.messages) return state;

        return {
          messages,
          requestedSendIds: withoutId(state.requestedSendIds, messageId),
        };
      });
    },

    requestRetry: (messageId) => {
      set((state) => {
        const messages = replaceMessageStatus(
          state.messages,
          messageId,
          'failed',
          'pending',
        );

        if (messages === state.messages) return state;

        return {
          messages,
          requestedSendIds: addUnique(state.requestedSendIds, messageId),
          selectedIds: withoutId(state.selectedIds, messageId),
        };
      });
    },
  };

  return { ...initialOutboxState, ...actions };
});
