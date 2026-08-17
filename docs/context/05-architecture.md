# Architecture

## Principles

- Domain transitions are explicit and testable.
- Queue policy is independent of presentation.
- Network resources have clear ownership.
- Components receive data and callbacks rather than implementing scheduling rules.
- Derived values are computed rather than duplicated in state.

## Proposed source structure

```text
src/
  api/
    messageApi.ts              # Provided; do not modify
  components/
    ComposeForm.tsx
    Outbox.tsx
    MessageItem.tsx
    StatusBadge.tsx
  hooks/
    useOutbox.ts               # UI-facing domain API
    useStableListFocus.ts      # Keyboard/focus behavior
  outbox/
    outboxReducer.ts           # Pure transitions
    selectors.ts               # Ordering and eligibility
    scheduler.ts               # Per-recipient execution policy
    types.ts                   # Internal action/attempt types
  types/
    message.ts                 # Provided domain type
  App.tsx
  main.tsx
  styles.css
```

The exact number of files should stay proportional to the assignment. Small modules may be combined when their boundary remains clear.

## Responsibilities

### `App`

Composes page regions and obtains the outbox view model. It should not manage abort controllers or determine which message sends next.

### `ComposeForm`

Owns temporary input values and validation presentation. It emits valid message input to the domain layer.

### `Outbox`

Renders list-level controls, selection summary, empty state, and live announcements. It coordinates keyboard navigation but does not call the mock API.

### `MessageItem`

Renders message metadata, plain-text content, selection, status, and contextual cancel/retry actions. It uses stable IDs for labels and keys.

### `useOutbox`

Exposes application actions such as compose, toggle selection, send selected, cancel, and retry. It connects reducer state to the scheduler lifecycle.

### Reducer

Owns pure state transitions. Suggested actions include:

- `messageComposed`
- `selectionToggled`
- `selectionCleared`
- `sendRequested`
- `sendStarted`
- `sendSucceeded`
- `sendFailed`
- `sendCancelled`
- `retryRequested`

Invalid transitions should be ignored safely or surfaced during development.

### Selectors

Compute ordered messages, selectable IDs, recipient lanes, earlier blockers, and action availability. They contain no side effects.

### Scheduler

Owns active attempts and calls `sendMessage`. It evaluates recipient lanes, dispatches lifecycle actions, handles aborts, and rejects stale results.

## State boundaries

Reducer state should contain serializable product state: messages, selection, and requested-send intent. Controllers, promises, and attempt tokens belong to the scheduler/ref layer.

Avoid mirroring derived concepts such as “has selected messages” or recipient group arrays in state. Compute them from the canonical collections.

## Dependency direction

```text
components -> useOutbox -> reducer/selectors
                        -> scheduler -> messageApi
```

The API and scheduler must not import UI components. Pure reducer/selectors must not import React or the network API.

## Error handling

Expected network failures are domain outcomes and become `failed`. Programming errors should remain visible during development rather than being mislabeled as ordinary network failures. Abort detection should use `error instanceof DOMException && error.name === 'AbortError'`, with a defensive name check if the runtime requires it.
