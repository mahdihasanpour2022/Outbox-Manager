# Queue and Concurrency

## Design objective

The queue policy should be isolated from React presentation so that sending rules can change without rewriting list components. The scheduler consumes message state and emits domain actions; components only express user intent and render state.

## Scheduling model

Conceptually, maintain one ordered lane per normalized recipient:

```text
alex: [A1] -> [A2] -> [A3]
sam:  [S1] -> [S2]

alex and sam may run concurrently.
Only one item in each lane may run at a time.
```

Messages in each lane are ordered by creation time, with ID as a tie-breaker. The earliest blocking message controls whether later messages are eligible.

## Eligibility

A message may start only when all of the following are true:

- It is `pending`.
- It has been explicitly submitted for sending under the chosen UI model.
- No request is active for its recipient.
- No earlier blocking message exists for that recipient.
- No active attempt already exists for its message ID.

The implementation must distinguish merely pending messages from messages the user has asked to send. This can be represented by a scheduler-owned set of requested message IDs or by another explicit queue flag outside the required `Message` type.

## Failure blocking

An earlier `failed` message blocks later messages for that recipient. Retrying it restores it to `pending` and makes the lane eligible again. Other recipient lanes are evaluated independently.

## Active attempts

Keep an imperative registry keyed by message ID or recipient:

```ts
interface ActiveAttempt {
  attemptId: string;
  messageId: string;
  recipient: string;
  controller: AbortController;
}
```

The registry prevents duplicate requests and provides cancellation. `attemptId` protects against stale completions when a message is cancelled and later retried.

## Processing outline

```text
schedule(messages, requestedIds):
  group messages by normalized recipient

  for each recipient without an active attempt:
    sort that recipient's messages by createdAt, then id
    find the earliest message that affects ordering

    if it is failed:
      pause this lane
    else if it is pending and requested:
      begin one attempt
    else:
      do nothing
```

Beginning an attempt:

1. Create and register an `AbortController` and unique attempt ID.
2. Dispatch `sendStarted` synchronously so the UI shows `sending`.
3. Call `sendMessage(message.id, controller.signal)`.
4. On resolution, dispatch success only if the same attempt is still current.
5. On rejection, distinguish `AbortError` from network failure.
6. Remove the active attempt only if its identity still matches.
7. Re-run scheduling so the next eligible recipient lane can progress.

## Cancellation outline

1. Find the current active attempt.
2. Remove or invalidate its identity before a stale callback can commit.
3. Abort its controller.
4. Dispatch `sendCancelled`, returning the message to `pending` and removing it from the requested set unless product behavior says otherwise.
5. Re-evaluate the recipient lane.

## React integration

- Use a reducer for deterministic domain transitions.
- Keep controllers and attempt identities in refs or a dedicated scheduler object, not render state.
- Make effects idempotent because React Strict Mode deliberately replays development lifecycle work.
- Do not start requests directly during render.
- Avoid an effect whose cleanup aborts legitimate requests merely because Strict Mode replayed it; scheduler ownership and explicit disposal should be deliberate.
- On true application unmount, abort all active controllers to prevent orphaned work.

## Change-friendly boundary

Future policies—continue after failure, retry with backoff, per-recipient concurrency limits, or global throttling—should be changes to scheduler eligibility and progression rules. They should not require changes to message cards, selection controls, or form components.
