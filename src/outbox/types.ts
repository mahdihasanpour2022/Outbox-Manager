import type { Message } from '../types/message';

export interface ComposeMessageInput {
  recipient: string;
  subject: string;
  body: string;
}

export interface OutboxState {
  messages: Message[];
  selectedIds: string[];
  requestedSendIds: string[];
}

export interface OutboxActions {
  composeMessage: (input: ComposeMessageInput) => Message;
  toggleSelection: (messageId: string) => void;
  clearSelection: () => void;
  requestSelectedSend: () => void;
  markSendStarted: (messageId: string) => void;
  markSendSucceeded: (messageId: string) => void;
  markSendFailed: (messageId: string) => void;
  markSendCancelled: (messageId: string) => void;
  requestRetry: (messageId: string) => void;
}

export type OutboxStore = OutboxState & OutboxActions;
