# Outbox Manager

A resilient, keyboard-accessible message outbox built with React 19, TypeScript, Zustand, Tailwind CSS, and Vite.

The application is designed around one invariant: messages to the same recipient are delivered in creation order, while different recipients are processed concurrently. The UI remains immediate and honest while the provided network API is slow, unreliable, cancellable, and resolves out of order.

## Run locally

```bash
pnpm install
pnpm dev
```

Useful verification commands:

```bash
pnpm test       # deterministic unit and render tests
pnpm build      # strict TypeScript check plus production bundle
pnpm check      # complete interview-submission verification
```

## Product behavior

- Compose plain-text messages with accessible validation.
- Select one or more pending messages and send them immediately.
- Process one message at a time per normalized recipient.
- Process unrelated recipients concurrently.
- Cancel an active send and return it honestly to `pending`.
- Pause a recipient lane after failure until the failed message is retried.
- Announce important state changes without moving keyboard focus.
- Navigate message rows with Arrow Up/Down, Home, and End; press Space on a row to toggle pending selection.

## Architecture

The application uses a feature-based boundary. The outbox feature exposes a deliberately small public API through `src/features/outbox/index.ts`; consumers do not reach into its internal components or model directly.

```text
src/
  api/
    messageApi.ts               # Provided unreliable API; unchanged
  types/
    message.ts                  # Provided domain contract
  features/
    outbox/
      components/               # Compose, list, item, and status UI
      hooks/                    # Stable keyboard focus behavior
      model/                    # Zustand store, selectors, scheduler, tests
      index.ts                  # Public feature API
  App.tsx                       # Page composition
  main.tsx                      # App and scheduler startup
  styles.css                    # Tailwind v4 entrypoint
```

The data flow is intentionally one-way:

```text
UI intent -> Zustand actions -> serializable product state
                                  |
                                  v
                         recipient scheduler -> message API
                                  |
                                  v
                         guarded status actions -> UI
```

Zustand stores product truth: messages, selection, requested sends, and accessible activity events. The scheduler separately owns promises, `AbortController` instances, and unique attempt tokens. This prevents effectful resources from leaking into UI state and makes sending-policy changes local to the model layer.

## Delivery policy

If a message fails, later messages for that recipient remain paused. Automatically continuing could deliver a follow-up without the context of the failed message. Other recipient lanes continue independently, so the conservative policy does not create global head-of-line blocking.

See [NOTES.md](./NOTES.md) for the decision rationale and production-scale tradeoffs. Detailed implementation context and verification evidence live in [docs/context](./docs/context).

## Verification

The deterministic test suite covers:

- Same-recipient ordering and non-overlap
- Cross-recipient concurrency
- Failure blocking and retry progression
- Cancellation and stale completion rejection
- Guarded store transitions
- Same-millisecond creation ordering
- Plain-text escaping and failure controls

The production build and dev-server smoke test are documented in [docs/context/09-verification.md](./docs/context/09-verification.md).

## Assignment constraints

This solution uses the required React 19, TypeScript, Vite, and pnpm stack. It does not use a component library, form library, or data-grid library. The provided files `src/api/messageApi.ts` and `src/types/message.ts` remain unchanged.

The original exercise requires:

1. A message with recipient, subject, body, creation time, and one of four states: `pending`, `sending`, `delivered`, or `failed`.
2. Immediate UI feedback while an API takes one to three seconds, fails approximately 30% of the time, and completes calls in arbitrary order.
3. In-order delivery per recipient without allowing one recipient to delay another.
4. Cancellation through `AbortSignal` without claiming a network result that did not happen.
5. Full keyboard usability with stable focus while the list changes.
6. A short `NOTES.md` explaining the failure policy and scale/time tradeoffs.

When creating the submission ZIP, exclude `node_modules` and other ignored build artifacts.
