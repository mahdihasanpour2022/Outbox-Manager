# Accessibility and Keyboard

## Goal

Every operation must be possible without a mouse, and dynamic updates must not make a keyboard user lose their location.

## Semantic foundation

Prefer native elements before adding ARIA:

- Use a real `<form>` with associated `<label>` elements.
- Use native `<button>` and checkbox controls.
- Represent the outbox with a semantic list when each message is a self-contained item.
- Use a table only if the implementation genuinely follows table semantics and remains usable at narrow widths.
- Give the page one clear `<h1>` and label major regions.

Avoid inventing a `listbox` unless selection and keyboard interaction fully implement that ARIA pattern. A list containing checkboxes and action buttons is often simpler and more predictable.

## Keyboard behavior

Baseline native behavior:

- `Tab` and `Shift+Tab` move through interactive controls.
- `Space` toggles a focused checkbox.
- `Enter` activates a focused button and submits the compose form from appropriate fields.
- All cancel and retry actions are reachable and visibly focused.

For efficient list navigation, support a documented roving-focus model on message rows:

- `ArrowDown`: move to the next message.
- `ArrowUp`: move to the previous message.
- `Home`: move to the first message.
- `End`: move to the last message.
- `Space`: toggle selection when focus is on the row selection control.

Arrow-key enhancement must not interfere with typing in form controls or with native behavior inside nested interactive elements.

## Stable focus

Track focus by stable message ID, never solely by array index.

After a render:

- If the focused message still exists, preserve focus on that message or the same action within it.
- If it was removed, focus the nearest surviving neighbor, preferring the next item and then the previous item.
- If no messages remain, move focus to a meaningful stable control such as the compose heading or recipient field.
- Status changes alone must not move focus.
- Reordering should preserve the same focused message ID.

Do not use changing status values as React keys. Use `message.id`.

## Selection

- Each checkbox has an accessible name that identifies the message, for example `Select “Quarterly update” for Alex`.
- A select-all checkbox, if present, exposes its mixed state with the native `indeterminate` property.
- Disabled or ineligible items are explained by visible status/action availability rather than relying only on `disabled` styling.

## Announcements

Use a visually subtle `aria-live="polite"` status region for concise events such as:

- `Sending “Quarterly update” to Alex.`
- `“Quarterly update” was delivered.`
- `“Quarterly update” failed. Later messages to Alex are paused.`
- `Sending cancelled. “Quarterly update” returned to pending.`

Avoid announcing every render or duplicating visible labels. Unexpected failures may use `role="alert"` when immediate interruption is justified.

## Visual requirements

- Provide a clear `:focus-visible` indicator.
- Do not communicate status with color alone.
- Maintain readable contrast.
- Keep touch/click targets comfortably sized without harming keyboard order.
- Respect reduced-motion preferences if animations are added.

## Verification

Complete the full workflow using only the keyboard: compose, navigate, select multiple messages, send, cancel, identify a failure, retry, and continue navigating while statuses update.
