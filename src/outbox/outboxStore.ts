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
  lastActivity: null,
  activitySequence: 0,
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

function createMessage(input: ComposeMessageInput, createdAt: number): Message {
  return {
    id: crypto.randomUUID(),
    recipient: input.recipient.trim(),
    subject: input.subject.trim(),
    body: input.body,
    status: 'pending',
    createdAt,
  };
}

export const useOutboxStore = create<OutboxStore>()((set, get) => {
  const actions: OutboxActions = {
    composeMessage: (input) => {
      let message: Message | undefined;

      set((state) => {
        const latestCreatedAt = state.messages.reduce(
          (latest, candidate) => Math.max(latest, candidate.createdAt),
          0,
        );
        message = createMessage(
          input,
          Math.max(Date.now(), latestCreatedAt + 1),
        );
        return { messages: [...state.messages, message] };
      });

      if (!message) throw new Error('Message creation did not complete.');
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

    selectAllPending: () => {
      set((state) => {
        const selectedIds = state.messages
          .filter((message) => message.status === 'pending')
          .map((message) => message.id);

        if (
          selectedIds.length === state.selectedIds.length &&
          selectedIds.every((id) => state.selectedIds.includes(id))
        ) {
          return state;
        }

        return { selectedIds };
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

        if (messages === state.messages) return state;

        const activitySequence = state.activitySequence + 1;
        return {
          messages,
          activitySequence,
          lastActivity: {
            sequence: activitySequence,
            type: 'send-started',
            messageId,
          },
        };
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

        const activitySequence = state.activitySequence + 1;
        return {
          messages,
          requestedSendIds: withoutId(state.requestedSendIds, messageId),
          selectedIds: withoutId(state.selectedIds, messageId),
          activitySequence,
          lastActivity: {
            sequence: activitySequence,
            type: 'send-succeeded',
            messageId,
          },
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

        const activitySequence = state.activitySequence + 1;
        return {
          messages,
          requestedSendIds: withoutId(state.requestedSendIds, messageId),
          selectedIds: withoutId(state.selectedIds, messageId),
          activitySequence,
          lastActivity: {
            sequence: activitySequence,
            type: 'send-failed',
            messageId,
          },
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

        const activitySequence = state.activitySequence + 1;
        return {
          messages,
          requestedSendIds: withoutId(state.requestedSendIds, messageId),
          activitySequence,
          lastActivity: {
            sequence: activitySequence,
            type: 'send-cancelled',
            messageId,
          },
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

        const activitySequence = state.activitySequence + 1;
        return {
          messages,
          requestedSendIds: addUnique(state.requestedSendIds, messageId),
          selectedIds: withoutId(state.selectedIds, messageId),
          activitySequence,
          lastActivity: {
            sequence: activitySequence,
            type: 'retry-requested',
            messageId,
          },
        };
      });
    },
  };

  return { ...initialOutboxState, ...actions };
});
