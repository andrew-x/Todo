type LogLevel = 'info' | 'error'

const LEVEL_STYLES: Record<LogLevel, string> = {
  info: 'color: #60a5fa; font-weight: bold',
  error: 'color: #f87171; font-weight: bold',
}

function formatArg(arg: unknown): unknown {
  if (arg instanceof Error) {
    return arg.stack ?? `${arg.name}: ${arg.message}`
  }
  if (typeof arg === 'object' && arg !== null) {
    try {
      return JSON.stringify(arg, null, 2)
    } catch {
      return arg
    }
  }
  return arg
}

function log(level: LogLevel, ...args: unknown[]) {
  const timestamp = new Date().toISOString()
  const formatted = args.map(formatArg)
  const consoleFn = level === 'error' ? console.error : console.info

  consoleFn(
    `%c[${level.toUpperCase()}]`,
    LEVEL_STYLES[level],
    timestamp,
    ...formatted,
  )
}

const logger = {
  info: (...args: unknown[]) => log('info', ...args),
  error: (...args: unknown[]) => log('error', ...args),
}

export default logger
