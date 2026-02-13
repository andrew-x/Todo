import { nanoid } from 'nanoid'

export function generateId(prefix: string) {
  return prefix ? `${prefix}-${nanoid()}` : nanoid()
}
