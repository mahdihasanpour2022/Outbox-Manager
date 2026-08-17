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
    useStableListFocus.ts      # Keyboard/focus behavior
  outbox/
    outboxStore.ts             # Typed Zustand state and actions
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

Composes page regions and selects the outbox view model from the Zustand store. It should not manage abort controllers or determine which message sends next.

### `ComposeForm`

Owns temporary input values and validation presentation. It emits valid message input to the domain layer.

### `Outbox`

Renders list-level controls, selection summary, empty state, and live announcements. It coordinates keyboard navigation but does not call the mock API.

### `MessageItem`

Renders message metadata, plain-text content, selection, status, and contextual cancel/retry actions. It uses stable IDs for labels and keys.

### Zustand store

`useOutboxStore` is created with Zustand's typed curried API:

```ts
export const useOutboxStore = create<OutboxState & OutboxActions>()(
  (set, get) => ({
    // initial state and actions
  }),
);
```

It owns serializable product state and exposes actions such as:

- `composeMessage`
- `toggleSelection`
- `clearSelection`
- `requestSelectedSend`
- `markSendStarted`
- `markSendSucceeded`
- `markSendFailed`
- `markSendCancelled`
- `requestRetry`

Actions that depend on previous state use functional `set((state) => nextState)` updates. Invalid transitions should be ignored safely or surfaced during development. Actions remain synchronous domain transitions; they do not own promises or abort controllers.

Components subscribe to the smallest practical slice with atomic selectors such as `useOutboxStore((state) => state.messages)`. If one selector constructs a multi-value object or array, wrap it with `useShallow` from `zustand/react/shallow` to avoid rerenders when its selected values are shallowly unchanged. Do not subscribe components to the entire store by default.

### Selectors

Compute ordered messages, selectable IDs, recipient lanes, earlier blockers, and action availability. They contain no side effects.

### Scheduler

Owns active attempts and calls `sendMessage`. It evaluates recipient lanes, dispatches lifecycle actions, handles aborts, and rejects stale results.

## State boundaries

Zustand state should contain serializable product state: messages, selection, requested-send intent, and synchronous actions. Controllers, promises, and attempt tokens belong to the scheduler layer.

Avoid mirroring derived concepts such as “has selected messages” or recipient group arrays in state. Compute them from the canonical collections.

## Dependency direction

```text
components -> Zustand selectors/actions
                  ^             |
                  |             v
             scheduler ----> messageApi
```

The scheduler may access the store imperatively but must not import UI components. Selectors must remain pure and must not import React or the network API. The store actions must not call the mock API directly.

## Error handling

Expected network failures are domain outcomes and become `failed`. Programming errors should remain visible during development rather than being mislabeled as ordinary network failures. Abort detection should use `error instanceof DOMException && error.name === 'AbortError'`, with a defensive name check if the runtime requires it.
