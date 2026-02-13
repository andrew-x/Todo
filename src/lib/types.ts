export type Priority =
  | 'P0 - Critical'
  | 'P1 - Important'
  | 'P2 - Standard'
  | 'P3 - Optional'
  | 'P4 - Later'

export const PRIORITIES: Priority[] = [
  'P0 - Critical',
  'P1 - Important',
  'P2 - Standard',
  'P3 - Optional',
  'P4 - Later',
]

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type Color =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'

export type ParsedTaskFields = {
  category: string | null
  priority: Priority | null
  dueDate: string | null
}

export type Profile = {
  id: string // user id

  categories: string[]

  createdAt: number // timestamp in milliseconds
  updatedAt: number // timestamp in milliseconds
}

export type Task = {
  id: string
  userId: string

  title: string
  description: string

  isDone: boolean

  category: string | null

  queue: 'day' | 'week' | null
  priority: Priority | null
  order: number | null

  dueDate: string | null // date in YYYY-MM-DD format

  completedAt: number | null // timestamp in milliseconds
  createdAt: number // timestamp in milliseconds
  updatedAt: number // timestamp in milliseconds
}
