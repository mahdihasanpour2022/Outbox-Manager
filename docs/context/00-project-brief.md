# Project Brief

## Product

Outbox Manager is an internal messaging outbox for people who need immediate, honest feedback while an unreliable network processes their messages.

Users can compose messages, inspect the queue, select messages to send, cancel in-progress sends, identify failures, and operate the entire interface without a mouse.

## Core guarantee

Messages addressed to the same recipient must be delivered in the order in which they were created. Work for one recipient must never delay work for another recipient.

This yields two fundamental scheduling rules:

1. Send messages sequentially within each recipient's queue.
2. Process different recipients' queues concurrently.

## Required behavior

- Compose a message with a recipient, subject, and plain-text body.
- Display subject, recipient, creation time, and current status for every message.
- Support selecting any number of messages.
- Send selected messages with immediate UI feedback.
- Display `pending`, `sending`, `delivered`, and `failed` states honestly.
- Allow an in-progress send to be cancelled.
- Return a cancelled message to `pending` without reporting delivery.
- Keep keyboard focus stable while message statuses and list contents change.
- Make all functionality available from the keyboard.

## Technical constraints

- React 19, TypeScript, Vite, and pnpm are required.
- `src/api/messageApi.ts` must not be modified.
- Component, form, and data-grid libraries are prohibited.
- Message bodies are untrusted plain text and must never be rendered as HTML.
- Sending takes one to three seconds, fails roughly 30% of the time, supports `AbortSignal`, and may complete in any order.
- The implementation should be small enough for the assignment's two-to-three-hour time box.

## Deliverables

- A project that runs from a fresh copy using `pnpm install && pnpm dev`.
- A short root-level `NOTES.md` explaining the same-recipient failure policy and meaningful scale/time tradeoffs.
- A submission archive that excludes `node_modules`.

## Success criteria

The solution is successful when its state is truthful, its ordering guarantee is demonstrable, unrelated recipients do not block each other, cancellation is race-safe, and a keyboard user never loses their working position.

## Non-goals

- Server persistence or authentication
- Rich-text or HTML message bodies
- A production backend
- A generalized job-processing framework
- Visual polish at the expense of queue correctness or accessibility
