type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

const isDevelopment = process.env.NODE_ENV === 'development'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

function getMinLevel(): number {
  return isDevelopment ? LOG_LEVELS.debug : LOG_LEVELS.error
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= getMinLevel()
}

function formatContext(context?: LogContext): string {
  if (!context) return ''
  return ` ${JSON.stringify(context)}`
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (shouldLog('debug')) {
      console.log(`[DEBUG] ${message}${formatContext(context)}`)
    }
  },

  info(message: string, context?: LogContext): void {
    if (shouldLog('info')) {
      console.log(`[INFO] ${message}${formatContext(context)}`)
    }
  },

  warn(message: string, context?: LogContext): void {
    if (shouldLog('warn')) {
      console.warn(`[WARN] ${message}${formatContext(context)}`)
    }
  },

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (shouldLog('error')) {
      const errorContext: LogContext = { ...context }
      if (error instanceof Error) {
        errorContext.errorMessage = error.message
        if (isDevelopment) {
          errorContext.stack = error.stack
        }
      } else if (error) {
        errorContext.error = error
      }
      console.error(`[ERROR] ${message}${formatContext(errorContext)}`)
    }
  },
}
