# Test Strategy

## Priorities

The highest-risk behavior is asynchronous scheduling, followed by cancellation races and dynamic-list focus. Visual details are lower risk and can rely more on focused manual verification within the assignment time box.

## Test seam

The scheduler should accept the send function as a dependency or otherwise expose a narrow seam so tests can control promise resolution, rejection, and abortion. Tests should not depend on random delays or the mock API's random failure rate.

## Zustand store tests

- Exercise actions through `useOutboxStore.getState()` and reset store state between tests.
- New messages begin pending.
- Send start changes only an eligible pending message to sending.
- Success changes the current sending attempt to delivered.
- Network failure changes the current sending attempt to failed.
- Cancellation changes sending to pending.
- Retry changes failed to pending and restores send eligibility.
- Stale or duplicate lifecycle actions do not overwrite newer state.
- Selection is removed or retained according to the documented action policy.
- Actions that depend on previous state do not lose updates when invoked in quick succession.
- Derived selectors return the expected ordering and eligibility without mutating store state.

## Scheduler tests

### Same recipient

- Two messages for one recipient never have overlapping API calls.
- Creation order is respected even if selection order differs.
- The second call begins only after the first succeeds.
- An earlier failed message prevents the second from starting.
- Retrying and delivering the failed message permits the next message to start.
- Cancelling the active message returns it to pending and does not report failure.

### Different recipients

- First messages for two recipients may start concurrently.
- Failure or cancellation in one lane does not block the other lane.
- Out-of-order network completion updates the correct message.

### Race protection

- Cancel followed by a late rejection does not produce failed state.
- Cancel and retry followed by an old completion does not mark the new attempt delivered.
- Repeated send/retry actions create at most one active attempt for a message.
- Unmount/disposal aborts active work without committing misleading outcomes.

## Component and interaction tests

- Required compose fields have labels and validation feedback.
- HTML-looking body input is rendered literally.
- Selection controls have message-specific accessible names.
- `Send Selected` is disabled without eligible selection.
- Status is available as text.
- Cancel and retry appear only when valid.
- Live announcements describe send, success, failure, and cancellation.

## Keyboard and focus scenarios

- Tab order reaches every action logically.
- Space toggles selection.
- Arrow, Home, and End navigation follow the documented behavior.
- A status change preserves focus on the same message/action.
- Reordering preserves focus by ID.
- Removal chooses the documented neighboring fallback.
- Emptying the list moves focus to a meaningful stable target.

## Manual adversarial pass

Create interleaved messages for at least two recipients, select them in a different order from creation, then repeatedly send, cancel, retry, and navigate while requests settle. Confirm the visible history never claims a result the network did not produce.

## Build verification

- `pnpm build` succeeds without TypeScript errors.
- `pnpm dev` starts successfully.
- The browser console has no React key, state-update, or accessibility-related warnings during the main workflow.
- A fresh installation requires no undeclared global dependency.
