import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { outboxScheduler } from './outbox/scheduler';

outboxScheduler.start();

if (import.meta.hot) {
  import.meta.hot.dispose(() => outboxScheduler.stop());
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
