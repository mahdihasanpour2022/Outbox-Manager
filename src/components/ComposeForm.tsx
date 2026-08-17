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
    <section className="compose-card" aria-labelledby={`${id}-title`}>
      <header className="card-heading">
        <div className="heading-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </div>
        <div>
          <p className="eyebrow">New message</p>
          <h2 id={`${id}-title`}>Compose</h2>
          <p className="section-description">
            Add a message now and decide when it leaves your outbox.
          </p>
        </div>
      </header>

      <form className="compose-form" onSubmit={handleSubmit} onReset={handleReset} noValidate>
        <div className="field-group">
          <label htmlFor={`${id}-recipient`}>Recipient</label>
          <div className={`input-shell ${errors.recipient ? 'has-error' : ''}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
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
              value={draft.recipient}
              aria-invalid={Boolean(errors.recipient)}
              aria-describedby={errors.recipient ? recipientErrorId : undefined}
              onChange={(event) => updateField('recipient', event.currentTarget.value)}
            />
          </div>
          {errors.recipient && <p className="field-error" id={recipientErrorId}>{errors.recipient}</p>}
        </div>

        <div className="field-group">
          <label htmlFor={`${id}-subject`}>Subject</label>
          <input
            ref={subjectRef}
            className={errors.subject ? 'has-error' : ''}
            id={`${id}-subject`}
            name="subject"
            type="text"
            placeholder="What is this about?"
            value={draft.subject}
            aria-invalid={Boolean(errors.subject)}
            aria-describedby={errors.subject ? subjectErrorId : undefined}
            onChange={(event) => updateField('subject', event.currentTarget.value)}
          />
          {errors.subject && <p className="field-error" id={subjectErrorId}>{errors.subject}</p>}
        </div>

        <div className="field-group">
          <div className="label-row">
            <label htmlFor={`${id}-body`}>Message</label>
            <span>Plain text</span>
          </div>
          <textarea
            ref={bodyRef}
            className={errors.body ? 'has-error' : ''}
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
            <p className="field-error" id={bodyErrorId}>{errors.body}</p>
          ) : (
            <p className="field-help" id={`${id}-body-help`}>
              Formatting is preserved exactly as you write it.
            </p>
          )}
        </div>

        <div className="form-actions">
          <button className="button button-secondary" type="reset">Clear</button>
          <button className="button button-primary" type="submit">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
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
