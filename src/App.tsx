import ComposeForm from './components/ComposeForm';
import Outbox from './components/Outbox';
import { useOutboxStore } from './outbox/outboxStore';

export default function App() {
  const messageCount = useOutboxStore((state) => state.messages.length);

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#main-content" aria-label="Outbox Manager home">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </span>
          <span>Outbox</span>
        </a>
        <div className="queue-pill" aria-label={`${messageCount} messages in outbox`}>
          <span aria-hidden="true" />
          {messageCount} {messageCount === 1 ? 'message' : 'messages'}
        </div>
      </header>

      <main id="main-content" className="page-content">
        <section className="hero" aria-labelledby="page-title">
          <p className="eyebrow">Message workspace</p>
          <h1 id="page-title">Stay in control of every send.</h1>
          <p>
            Compose now, send when you are ready, and always know what is
            happening in your queue.
          </p>
        </section>

        <div className="workspace-grid">
          <ComposeForm />
          <Outbox />
        </div>
      </main>
    </div>
  );
}
