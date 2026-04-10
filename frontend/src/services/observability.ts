import { normalizeError } from './errorUtils'

type LogLevel = 'info' | 'warn' | 'error'
type Metadata = Record<string, unknown>

const isDevelopment = import.meta.env.DEV

function writeLog(level: LogLevel, message: string, metadata?: Metadata) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    metadata,
  }

  if (level === 'info') {
    console.info('[nextgen]', payload)
    return
  }

  if (level === 'warn') {
    console.warn('[nextgen]', payload)
    return
  }

  console.error('[nextgen]', payload)
}

export function logInfo(message: string, metadata?: Metadata) {
  writeLog('info', message, metadata)
}

export function logWarn(message: string, metadata?: Metadata) {
  writeLog('warn', message, metadata)
}

export function captureException(error: unknown, metadata?: Metadata) {
  const normalized = normalizeError(error)

  writeLog('error', normalized.message, {
    ...metadata,
    errorName: normalized.name,
    stack: normalized.stack,
  })

  if (!isDevelopment && typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
    const endpoint = '/api/frontend-observability'
    const body = JSON.stringify({
      type: 'frontend-exception',
      ts: new Date().toISOString(),
      error: normalized,
      metadata,
    })
    navigator.sendBeacon(endpoint, body)
  }
}
