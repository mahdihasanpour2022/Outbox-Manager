# Decisions and Tradeoffs

This is a living decision log. Entries marked **Proposed** must be confirmed against the final implementation before they are copied into `NOTES.md`.

## D1: Pause a recipient after failure

**Status:** Proposed

When a message fails, later messages for the same recipient remain paused. Other recipients continue. The failed message can be retried explicitly.

This prevents a follow-up from arriving without the context of the earlier message. Continuing automatically would improve throughput but could preserve transport order while violating conversational intent.

## D2: Sequential lanes per recipient

**Status:** Proposed

Use a scheduler that allows one active request per normalized recipient and concurrent active requests across distinct recipients.

This directly represents the product guarantee and keeps future scheduling-policy changes localized.

## D3: Reducer plus imperative attempt registry

**Status:** Proposed

Keep serializable message/selection intent in a reducer. Keep controllers, promises, and unique attempt identities in a scheduler or refs.

Reducers make state transitions auditable; an imperative registry gives effectful network resources clear ownership without polluting domain objects.

## D4: Stable identity for async results and focus

**Status:** Proposed

Use message IDs for React keys, selection, and focus. Use an additional unique attempt ID for each send attempt.

A message ID preserves user position, while an attempt ID prevents a cancelled or superseded request from committing a stale result.

## D5: Native semantics with optional row navigation

**Status:** Proposed

Use native forms, buttons, checkboxes, and list semantics. Add arrow/Home/End movement as a focused enhancement without replacing native Tab navigation.

This provides a reliable baseline and avoids the complexity of an incorrectly implemented composite ARIA widget.

## D6: Plain-text rendering

**Status:** Required

Render bodies through normal React text interpolation and preserve line breaks with CSS. Never use `dangerouslySetInnerHTML`.

This matches the product requirement and prevents user-authored markup from being interpreted.

## D7: Minimal dependencies

**Status:** Proposed

Prefer React, TypeScript, browser APIs, and vanilla CSS. Add a small utility only when its benefit is concrete and record the reason in `NOTES.md`.

The problem is small, and avoiding unnecessary abstractions makes the queue rules easier to explain in a live review.

## D8: Time-boxed scale tradeoffs

**Status:** Proposed

For the take-home, in-memory state and a simple scan/group scheduler are sufficient. At scale, consider persistence, server-authoritative idempotency keys, bounded global concurrency, retry/backoff policy, virtualization for large lists, observability, and integration tests against deterministic network simulations.

These are intentionally deferred because they do not improve the core proof of ordering, independence, cancellation, and accessibility within the assignment scope.

## Finalization checklist

Before writing `NOTES.md`:

- Change each implemented decision to **Accepted**.
- Update or remove decisions that differ from the code.
- Record any dependency and why it was needed.
- Record incomplete behavior honestly.
- Summarize what would change for persistence, high volume, and distributed delivery.
