import type { Message } from '../../../types/message';

export interface ComposeMessageInput {
  recipient: string;
  subject: string;
  body: string;
}

export type OutboxActivityType =
  | 'send-started'
  | 'send-succeeded'
  | 'send-failed'
  | 'send-cancelled'
  | 'retry-requested';

export interface OutboxActivity {
  sequence: number;
  type: OutboxActivityType;
  messageId: string;
}

export interface OutboxState {
  messages: Message[];
  selectedIds: string[];
  requestedSendIds: string[];
  lastActivity: OutboxActivity | null;
  activitySequence: number;
}

export interface OutboxActions {
  composeMessage: (input: ComposeMessageInput) => Message;
  toggleSelection: (messageId: string) => void;
  selectAllPending: () => void;
  clearSelection: () => void;
  requestSelectedSend: () => void;
  markSendStarted: (messageId: string) => void;
  markSendSucceeded: (messageId: string) => void;
  markSendFailed: (messageId: string) => void;
  markSendCancelled: (messageId: string) => void;
  requestRetry: (messageId: string) => void;
}

export type OutboxStore = OutboxState & OutboxActions;
