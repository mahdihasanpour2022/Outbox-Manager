import ComposeForm from './components/ComposeForm';
import Outbox from './components/Outbox';
import { useOutboxStore } from './outbox/outboxStore';

export default function App() {
  const messageCount = useOutboxStore((state) => state.messages.length);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-800 antialiased">
      <div className="pointer-events-none absolute -right-32 -top-40 h-[34rem] w-[34rem] rounded-full bg-emerald-100/60 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-52 -left-44 h-[32rem] w-[32rem] rounded-full bg-sky-100/60 blur-3xl" aria-hidden="true" />

      <header className="relative mx-auto flex h-[70px] w-[calc(100%-1.5rem)] max-w-[1180px] items-center justify-between border-b border-slate-200/80 sm:h-[82px] sm:w-[calc(100%-2.5rem)]">
        <a className="inline-flex items-center gap-2.5 rounded-xl font-extrabold tracking-tight text-slate-800 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-blue-500/40" href="#main-content" aria-label="Outbox Manager home">
          <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-700/20" aria-hidden="true">
            <svg className="size-5 fill-none stroke-current stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" focusable="false">
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </span>
          <span>Outbox</span>
        </a>
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/75 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur" aria-label={`${messageCount} messages in outbox`}>
          <span className="size-2 rounded-full bg-emerald-600 ring-4 ring-emerald-100" aria-hidden="true" />
          {messageCount} {messageCount === 1 ? 'message' : 'messages'}
        </div>
      </header>

      <main id="main-content" className="relative mx-auto w-[calc(100%-1.5rem)] max-w-[1180px] py-10 sm:w-[calc(100%-2.5rem)] sm:py-14 lg:py-18">
        <section className="mb-8 max-w-3xl sm:mb-10" aria-labelledby="page-title">
          <p className="mb-2 text-xs font-bold tracking-[0.13em] text-emerald-700 uppercase">Message workspace</p>
          <h1 id="page-title" className="max-w-2xl text-[2.35rem] leading-[1.04] font-extrabold tracking-[-0.055em] text-slate-900 sm:text-5xl lg:text-6xl">Stay in control of every send.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            Compose now, send when you are ready, and always know what is
            happening in your queue.
          </p>
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(340px,0.88fr)_minmax(420px,1.12fr)]">
          <ComposeForm />
          <Outbox />
        </div>
      </main>
    </div>
  );
}
