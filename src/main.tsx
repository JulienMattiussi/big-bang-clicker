import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Dev only: React 19's dev build writes User Timing entries (performance.measure)
// on every render to feed the DevTools "React" track. In an idle game that
// re-renders continuously they pile up unbounded in the native timing buffer
// (multiple GB overnight). Purge it periodically. Production React emits none of
// this, so the guard keeps it out of the shipped bundle.
if (import.meta.env.DEV) {
  setInterval(() => {
    performance.clearMeasures()
    performance.clearMarks()
  }, 30_000)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
