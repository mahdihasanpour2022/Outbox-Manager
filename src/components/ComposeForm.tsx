import { useId, useRef, useState, type FormEvent } from 'react';
import { useOutboxStore } from '../outbox/outboxStore';

interface DraftMessage {
  recipient: string;
  subject: string;
  body: string;
}

type DraftErrors = Partial<Record<keyof DraftMessage, string>>;

const EMPTY_DRAFT: DraftMessage = { recipient: '', subject: '', body: '' };

function validateDraft(draft: DraftMessage): DraftErrors {
  const errors: DraftErrors = {};
  if (!draft.recipient.trim()) errors.recipient = 'Enter a recipient.';
  if (!draft.subject.trim()) errors.subject = 'Add a subject.';
  if (!draft.body.trim()) errors.body = 'Write a message.';
  return errors;
}

export default function ComposeForm() {
  const composeMessage = useOutboxStore((state) => state.composeMessage);
  const [draft, setDraft] = useState<DraftMessage>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [announcement, setAnnouncement] = useState('');
  const recipientRef = useRef<HTMLInputElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const id = useId();

  const updateField = (field: keyof DraftMessage, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setAnnouncement('');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateDraft(draft);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.recipient) recipientRef.current?.focus();
      else if (nextErrors.subject) subjectRef.current?.focus();
      else bodyRef.current?.focus();
      return;
    }

    const message = composeMessage(draft);
    setDraft(EMPTY_DRAFT);
    setAnnouncement(`“${message.subject}” was added to the outbox.`);
    recipientRef.current?.focus();
  };

  const handleReset = () => {
    setDraft(EMPTY_DRAFT);
    setErrors({});
    setAnnouncement('Draft cleared.');
    recipientRef.current?.focus();
  };

  const recipientErrorId = `${id}-recipient-error`;
  const subjectErrorId = `${id}-subject-error`;
  const bodyErrorId = `${id}-body-error`;

  return (
    <section className="rounded-3xl border border-slate-200/90 bg-white/90 p-6 shadow-[0_24px_70px_rgba(22,46,39,0.08)] backdrop-blur sm:p-8 lg:p-10" aria-labelledby={`${id}-title`}>
      <header className="flex items-start gap-3 border-b border-slate-200 pb-7 sm:gap-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700" aria-hidden="true">
          <svg className="size-5 fill-none stroke-current stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" focusable="false">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </div>
        <div>
          <p className="mb-2 text-[0.7rem] font-bold tracking-[0.13em] text-emerald-700 uppercase">New message</p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800" id={`${id}-title`}>Compose</h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-500">
            Add a message now and decide when it leaves your outbox.
          </p>
        </div>
      </header>

      <form className="grid gap-5 pt-7" onSubmit={handleSubmit} onReset={handleReset} noValidate>
        <div className="grid gap-2">
          <label className="text-sm font-bold text-slate-700" htmlFor={`${id}-recipient`}>Recipient</label>
          <div className={`flex items-center rounded-xl border bg-slate-50 pl-3 transition motion-reduce:transition-none focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-600/10 ${errors.recipient ? 'border-rose-600' : 'border-slate-300 hover:border-slate-400'}`}>
            <svg className="size-[18px] shrink-0 fill-none stroke-slate-400 stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M20 21a8 8 0 0 0-16 0" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <input
              ref={recipientRef}
              id={`${id}-recipient`}
              name="recipient"
              type="text"
              autoComplete="off"
              placeholder="e.g. Alex Morgan"
              className="min-w-0 flex-1 border-0 bg-transparent px-2.5 py-3 text-slate-800 outline-none placeholder:text-slate-400"
              value={draft.recipient}
              aria-invalid={Boolean(errors.recipient)}
              aria-describedby={errors.recipient ? recipientErrorId : undefined}
              onChange={(event) => updateField('recipient', event.currentTarget.value)}
            />
          </div>
          {errors.recipient && <p className="text-xs font-semibold text-rose-700" id={recipientErrorId}>{errors.recipient}</p>}
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-bold text-slate-700" htmlFor={`${id}-subject`}>Subject</label>
          <input
            ref={subjectRef}
            className={`w-full rounded-xl border bg-slate-50 px-3.5 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 motion-reduce:transition-none focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10 ${errors.subject ? 'border-rose-600' : 'border-slate-300 hover:border-slate-400'}`}
            id={`${id}-subject`}
            name="subject"
            type="text"
            placeholder="What is this about?"
            value={draft.subject}
            aria-invalid={Boolean(errors.subject)}
            aria-describedby={errors.subject ? subjectErrorId : undefined}
            onChange={(event) => updateField('subject', event.currentTarget.value)}
          />
          {errors.subject && <p className="text-xs font-semibold text-rose-700" id={subjectErrorId}>{errors.subject}</p>}
        </div>

        <div className="grid gap-2">
          <div className="flex items-baseline justify-between">
            <label className="text-sm font-bold text-slate-700" htmlFor={`${id}-body`}>Message</label>
            <span className="text-xs text-slate-400">Plain text</span>
          </div>
          <textarea
            ref={bodyRef}
            className={`min-h-40 w-full resize-y rounded-xl border bg-slate-50 px-3.5 py-3 leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 motion-reduce:transition-none focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10 ${errors.body ? 'border-rose-600' : 'border-slate-300 hover:border-slate-400'}`}
            id={`${id}-body`}
            name="body"
            rows={7}
            placeholder="Write your message…"
            value={draft.body}
            aria-invalid={Boolean(errors.body)}
            aria-describedby={errors.body ? bodyErrorId : `${id}-body-help`}
            onChange={(event) => updateField('body', event.currentTarget.value)}
          />
          {errors.body ? (
            <p className="text-xs font-semibold text-rose-700" id={bodyErrorId}>{errors.body}</p>
          ) : (
            <p className="text-xs text-slate-500" id={`${id}-body-help`}>
              Formatting is preserved exactly as you write it.
            </p>
          )}
        </div>

        <div className="grid grid-cols-[1fr_1.4fr] gap-2.5 pt-1 sm:flex sm:justify-end">
          <button className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:-translate-y-px hover:bg-slate-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-500/40 motion-reduce:transform-none motion-reduce:transition-none" type="reset">Clear</button>
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-700/20 transition hover:-translate-y-px hover:bg-emerald-800 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-500/40 motion-reduce:transform-none motion-reduce:transition-none" type="submit">
            <svg className="size-[18px] fill-none stroke-current stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
            Add to outbox
          </button>
        </div>

        <p className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</p>
      </form>
    </section>
  );
}
