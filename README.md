# Take-Home: Outbox Manager

## What this is

A small, focused exercise. We care far more about the **decisions you make
and why** than about how much code you write. Plan for **~2–3 hours**; if
you hit 3, stop. A working core with honest gaps beats a polished UI with
broken logic.

> Use whatever tools you like, including AI assistants. But everything you
> submit, you own: be ready to justify every decision live.

## The product

You are building the outbox for our internal messaging tool. People compose
messages to teammates; messages queue up and go out over a network that is
slow, unreliable, and answers in whatever order it likes. The people using
this are mid-task and impatient: they need to **always see what is really
happening**, and **always be able to change their mind**.

A message has a recipient, a subject, and a body, and is in one of four
states: `pending`, `sending`, `delivered`, `failed` (see
`src/types/message.ts`). Bodies are plain text written by people — render
them as exactly that.

**The one guarantee this product makes:** messages to the same person arrive
in the order they were written. And one recipient's problems must never
delay anyone else's messages.

One more thing worth knowing: sending rules change often in this product.
Assume yours will change too, and structure the code accordingly.

## Tasks

### Task 1 — The outbox

Compose messages and manage the queue: a list showing each message's
subject, recipient, when it was written, and its current state; select any
number of them; a "Send Selected" that sends them out under the guarantee
above. The UI reacts the instant the user acts — it never waits for the
network before showing that something happened.

### Task 2 — Delivery, honestly

Sending goes through `src/api/messageApi.ts`. It is slow, it fails about a
third of the time, and it finishes in any order. Your job is to keep the
user informed and in control anyway:

- A message that is sending can be **cancelled** — it returns to the queue,
  and the UI never claims something the network didn't do.
- Some sends will fail. The user should clearly see which ones.
- **Left to you (decide and defend):** when a message fails, what happens
  to the messages queued behind it for the same recipient? There is no
  single right answer.

### Task 3 — No mouse

The outbox must be fully usable without ever touching a mouse, following
the keyboard conventions a list like this is expected to have. And keyboard
users must never lose their place: the list will change under them —
statuses flip, messages appear and leave — and their position must survive
it.

## The mock API

Sending happens through the function provided in `src/api/messageApi.ts`.
Do not modify it — but do read it before you build. In short:

- It takes 1–3 seconds, at random.
- It fails about a third of the time, at random.
- Calls finish in any order.
- It can be stopped partway: pass an `AbortSignal`, and an aborted call
  throws an `AbortError`.

## Stack

**Required:** React 19 · TypeScript · Vite · pnpm
**Styling:** your choice (Tailwind, CSS Modules, SCSS, vanilla, CSS-in-JS)
**Do NOT use:** component libraries (MUI, Chakra, Radix, shadcn/ui, …),
form libraries, data-grid libraries. Small utilities (clsx, nanoid) are
fine — mention why in your NOTES.

## Deliverables

1. **The project, running cleanly:** `pnpm install && pnpm dev` works from
   a fresh copy of the folder.
2. **A short `NOTES.md`** (a few paragraphs) covering:
   1. the decision Task 2 left to you: when a message fails, what does
      your app do with the messages still waiting to reach that same
      recipient — and why is that better than the other way?
   2. anything you'd change at scale, or traded off for time.

## Submission

When done, send us a `.zip` of the project. Make sure it
 **excludes `node_modules`**.

Good luck!
