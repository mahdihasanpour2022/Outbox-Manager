import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Message } from '../../../types/message';
import MessageItem from './MessageItem';

const baseMessage: Message = {
  id: 'message-1',
  recipient: 'Alex',
  subject: 'Safety check',
  body: '<strong>not HTML</strong>\nSecond line',
  status: 'pending',
  createdAt: Date.UTC(2026, 0, 1, 12),
};

function renderMessage(
  message: Message,
  queueState: 'queued' | 'waiting' | null = null,
) {
  return renderToStaticMarkup(
    <MessageItem
      message={message}
      selected={false}
      selectable={message.status === 'pending' && queueState === null}
      queueState={queueState}
      onToggleSelection={vi.fn()}
      onCancel={vi.fn()}
      onRetry={vi.fn()}
      rowRef={vi.fn()}
      rowTabIndex={0}
      onRowFocus={vi.fn()}
      onRowBlur={vi.fn()}
      onRowKeyDown={vi.fn()}
    />,
  );
}

describe('MessageItem', () => {
  it('escapes user-authored markup and preserves plain-text line breaks', () => {
    const markup = renderMessage(baseMessage);

    expect(markup).toContain('&lt;strong&gt;not HTML&lt;/strong&gt;\nSecond line');
    expect(markup).not.toContain('<strong>not HTML</strong>');
    expect(markup).toContain('whitespace-pre-wrap');
  });

  it('shows retry and the recipient pause explanation only for failures', () => {
    const markup = renderMessage({ ...baseMessage, status: 'failed' });

    expect(markup).toContain('Retry');
    expect(markup).toContain('Later messages to Alex are paused');
    expect(markup).not.toContain('Cancel sending');
  });

  it('explains when a requested message is waiting in its recipient lane', () => {
    const markup = renderMessage(baseMessage, 'waiting');

    expect(markup).toContain('Waiting for an earlier message to Alex.');
    expect(markup).toContain('disabled');
  });
});
