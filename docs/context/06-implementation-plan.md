# Implementation Plan

## 1. Establish the Zustand domain store

- Add Zustand as the explicit state-management dependency.
- Define typed `OutboxState`, `OutboxActions`, and `useOutboxStore` with the curried `create<State & Actions>()(...)` API.
- Implement domain transitions as synchronous store actions using functional `set` updates when they depend on previous state.
- Implement allowed message transitions.
- Add selectors for stable ordering, selection eligibility, and recipient grouping.
- Use narrow component selectors; reserve `useShallow` for selectors that construct multi-value objects or arrays.
- Decide recipient normalization and deterministic tie-breaking.

Acceptance check: transitions are understandable without React components, invalid actions cannot create impossible status combinations, and the store contains no controllers or promises.

## 2. Implement the scheduler

- Add the requested-send concept.
- Enforce one active request per recipient.
- Permit concurrent requests across recipients.
- Track abort controllers and unique attempt identities.
- Implement success, failure, cancellation, and stale-result handling.
- Pause a recipient lane behind an earlier failure.

Acceptance check: same-recipient calls never overlap, different recipients can overlap, and cancellation never becomes failure.

## 3. Build the compose workflow

- Add labeled recipient, subject, and body fields.
- Validate required values.
- Create messages with stable IDs and timestamps.
- Render bodies safely as plain text with preserved line breaks.

Acceptance check: a keyboard user can create a message, and HTML-like body content is displayed literally.

## 4. Build the outbox list

- Show subject, recipient, creation time, and textual status.
- Add per-message selection.
- Add `Send Selected` and a clear disabled state.
- Add empty-state and selection summary content.

Acceptance check: selection uses message IDs and remains correct as statuses change.

## 5. Add control actions

- Expose cancel for sending messages.
- Expose retry for failed messages.
- Explain that later same-recipient messages pause after failure.
- Announce meaningful outcomes in a live region.

Acceptance check: cancel returns to pending, retry cannot duplicate an attempt, and other recipients continue after a failure.

## 6. Implement keyboard and focus behavior

- Use semantic native controls.
- Add visible focus styles.
- Add arrow, Home, and End navigation if using row-level navigation.
- Preserve focus by message ID across dynamic updates.
- Choose a sensible fallback when the focused item disappears.

Acceptance check: the complete workflow works without a mouse and focus remains visible and predictable during network updates.

## 7. Style responsively

- Use Tailwind CSS utilities with a mobile-first responsive layout and the official Tailwind Vite plugin.
- Ensure statuses have text and non-color cues.
- Support narrow screens and long user-authored content.
- Respect `prefers-reduced-motion` if transitions are present.

Acceptance check: content does not overflow at common mobile widths, and focus/status cues remain clear.

## 8. Verify and document

- Run TypeScript/Vite production build.
- Exercise deterministic edge cases with tests or a controllable test seam.
- Perform a keyboard-only pass.
- Review plain-text rendering and cancellation races.
- Write the required root `NOTES.md` from actual decisions and tradeoffs.
- Confirm `node_modules` is excluded from the final archive.

Acceptance check: `pnpm install && pnpm dev` works from a clean copy, the production build passes, and `NOTES.md` matches implemented behavior.
