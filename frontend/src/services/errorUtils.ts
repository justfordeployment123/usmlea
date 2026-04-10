export interface NormalizedError {
  message: string
  name: string
  stack?: string
}

export function normalizeError(error: unknown): NormalizedError {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    }
  }

  if (typeof error === 'string') {
    return {
      message: error,
      name: 'StringError',
    }
  }

  return {
    message: 'Unknown error',
    name: 'UnknownError',
  }
}

export function safeParseJson<T>(value: string | null): T | null {
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}
