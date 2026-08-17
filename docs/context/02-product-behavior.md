# Product Behavior

## Compose

The compose form collects recipient, subject, and body. Submission validates required fields, creates a stable ID and timestamp, appends a `pending` message, and clears or resets the form in a predictable way. The new message appears immediately; no network call is involved in composition.

Bodies remain plain text. Line breaks should be preserved visually with CSS such as `white-space: pre-wrap`, while React continues to escape the content.

## Selection and sending

Pending messages can be selected individually. The interface may offer select-all for eligible messages, but its scope and mixed state must be clear.

`Send Selected` should:

1. Capture the currently selected eligible message IDs.
2. Make scheduling progress visible immediately.
3. Clear or update selection consistently.
4. Let the scheduler enforce per-recipient ordering.

A later selected message must not jump ahead of an earlier pending or failed message for the same recipient.

## Status feedback

- `pending`: queued and not currently on the network.
- `sending`: an active request exists for this message.
- `delivered`: the request completed successfully.
- `failed`: the request completed with a non-abort error.

Status must be expressed with text, not color alone. Meaningful changes should also be announced through a polite live region without moving focus.

## Cancellation

A visible cancel action is available for each `sending` message. Activating it aborts that message's controller. The UI returns the message to `pending` promptly, and a later `AbortError` is treated as confirmation rather than failure.

Cancellation releases that recipient's active slot. It does not imply that the same message should immediately restart; the scheduler must respect the user's changed intent.

## Failure policy

When a message fails, later messages for the same recipient are paused behind it. Other recipients continue normally.

The user can retry the failed message or leave that recipient's queue paused. If a product-level discard/skip action is implemented, it must be explicit because allowing later delivery changes the practical meaning of strict message order.

This policy is chosen because silently continuing could deliver a reply or follow-up without the context of the failed earlier message. Pausing is more conservative, truthful, and user-controlled. Its cost is reduced throughput for that recipient, which is acceptable because unrelated recipients remain independent.

## Retry

Retry changes a failed message to `pending` and marks it eligible for scheduling. It must not start twice if the action is activated repeatedly. If retry is combined with an immediate send action, that behavior must be labeled clearly.

## Empty and unavailable actions

- An empty outbox explains how to add the first message.
- `Send Selected` is disabled when no eligible messages are selected.
- Selection controls for terminal or actively sending messages are disabled or omitted.
- Cancel is available only while a message has an active attempt.
- Retry is available only for failed messages.

## Honest races

If cancellation and network completion occur nearly simultaneously, exactly one outcome wins. A successful response that settled before cancellation may remain delivered; a confirmed abort returns to pending. The attempt identity prevents a late result from overwriting a newer user action.
