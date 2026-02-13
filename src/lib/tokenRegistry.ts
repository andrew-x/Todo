import * as chrono from 'chrono-node'

import { toISODate } from '@/lib/dayjs'
import { PRIORITIES } from '@/lib/types'
import type { ParsedTaskFields } from '@/lib/types'

const PRIORITY_PATTERN = /\b[Pp]([0-4])\b/g
const CATEGORY_PATTERN = /@([\w][\w-]*)(?:\s|$)/g

export function extractFieldsFromText(text: string): ParsedTaskFields {
  let priority: ParsedTaskFields['priority'] = null
  let category: string | null = null

  let dueDate: string | null = null

  // Priority (last match wins)
  let priorityMatch: RegExpExecArray | null
  while ((priorityMatch = PRIORITY_PATTERN.exec(text)) !== null) {
    priority = PRIORITIES[parseInt(priorityMatch[1], 10)]
  }
  PRIORITY_PATTERN.lastIndex = 0

  // Category (last match wins)
  let categoryMatch: RegExpExecArray | null
  while ((categoryMatch = CATEGORY_PATTERN.exec(text)) !== null) {
    category = categoryMatch[1]
  }
  CATEGORY_PATTERN.lastIndex = 0

  // Dates via chrono-node (last match wins)
  const chronoResults = chrono.parse(text, new Date(), { forwardDate: true })
  if (chronoResults.length > 0) {
    dueDate = toISODate(chronoResults[chronoResults.length - 1].start.date())
  }

  return { priority, category, dueDate }
}

export function getCleanTitle(text: string): string {
  let clean = text

  // Remove priority tokens
  clean = clean.replace(/\b[Pp][0-4]\b/g, '')

  // Remove category tokens
  clean = clean.replace(/@([\w][\w-]*)(?=\s|$)/g, '')

  // Remove chrono-detected date text (use original text for matching positions)
  const chronoResults = chrono.parse(text, new Date(), { forwardDate: true })
  for (const result of chronoResults) {
    clean = clean.replace(result.text, '')
  }

  // Collapse whitespace
  return clean.replace(/\s+/g, ' ').trim()
}
