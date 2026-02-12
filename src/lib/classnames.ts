import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

const cn = (
  ...args: Array<
    | string
    | Array<string | Record<string, unknown> | unknown>
    | Record<string, unknown>
    | undefined
    | null
    | boolean
  >
): string => {
  // Filter out undefined, null, and boolean values before processing
  const filteredArgs = args.filter(
    (arg) => arg !== undefined && arg !== null && typeof arg !== 'boolean',
  )
  return twMerge(clsx(...filteredArgs))
}
export default cn
