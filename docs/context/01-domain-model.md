# Domain Model

## Message

The source type is defined in `src/types/message.ts`:

```ts
type MessageStatus = 'pending' | 'sending' | 'delivered' | 'failed';

interface Message {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  status: MessageStatus;
  createdAt: number;
}
```

`id` is the stable identity used for selection, focus, cancellation, and protection from stale asynchronous results. `createdAt` determines ordering; `id` should be used as a deterministic tie-breaker if two timestamps match.

Recipient identifiers should be normalized consistently at composition time, at minimum by trimming surrounding whitespace. Whether recipient matching is case-sensitive must be explicit. For an email-like identifier, lowercasing is a reasonable local assumption.

## State transitions

Allowed transitions are:

```text
compose                  send succeeds
   |                          |
   v                          v
pending ---- send ----> sending ----> delivered
   ^                          |
   |                          | send fails
   | cancel                   v
   +---------------------- failed
                               |
                               | retry
                               v
                            pending
```

Rules:

- A new message begins as `pending`.
- Only a `pending` message can begin sending.
- A successful request changes `sending` to `delivered`.
- A non-abort rejection changes `sending` to `failed`.
- Cancelling an active request changes `sending` back to `pending`.
- Retrying a failed message first returns it to `pending`; the scheduler then controls when it may send.
- A delivered message is terminal for this exercise.

## Queue model

Messages are grouped by normalized recipient. Within a recipient group, relevant messages are ordered by `createdAt` and then `id`.

The scheduler may run at most one network request per recipient. It may run requests for multiple distinct recipients simultaneously.

Selection is UI state, not message domain state. Selecting a message does not imply that it is already scheduled or sending.

## Invariants

1. No recipient has more than one active send.
2. A later message never starts while an earlier non-delivered message for the same recipient blocks it.
3. A completion affects a message only if it still corresponds to that message's current active attempt.
4. An aborted request never produces `failed` or `delivered` UI state.
5. One recipient's pending, failed, or cancelled message does not prevent other recipient queues from progressing.
6. Message bodies are rendered as text through React interpolation, never through `dangerouslySetInnerHTML`.

## Supporting application state

State outside `Message` may include:

- `selectedIds: Set<string>` or an equivalent serializable representation
- `focusedMessageId: string | null`
- Active attempt/controller records stored outside render state
- Optional validation errors and live-region announcements

Abort controllers should not be stored in message objects. They are effectful resources owned by the sending layer.
