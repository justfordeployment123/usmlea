export function logInfo(message: string, meta?: Record<string, unknown>) {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ level: 'info', message, ...meta, ts: new Date().toISOString() }))
}

export function logError(message: string, meta?: Record<string, unknown>) {
  // eslint-disable-next-line no-console
  console.error(JSON.stringify({ level: 'error', message, ...meta, ts: new Date().toISOString() }))
}
