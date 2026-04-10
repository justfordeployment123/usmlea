import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { captureException, logInfo } from './services/observability'

window.addEventListener('error', event => {
  captureException(event.error ?? event.message, {
    source: 'window.error',
    file: event.filename,
    line: event.lineno,
    column: event.colno,
  })
})

window.addEventListener('unhandledrejection', event => {
  captureException(event.reason, {
    source: 'window.unhandledrejection',
  })
})

logInfo('Frontend bootstrap initialized')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
