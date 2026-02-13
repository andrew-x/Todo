# Dates (dayjs)

## Setup

- Use `dayjs` for all date manipulation and formatting
- Always import from `@/lib/dayjs` — never from `dayjs` directly
- The `@/lib/dayjs` module pre-configures plugins so they're available everywhere

```ts
// Correct

// Wrong — plugins won't be loaded
import dayjs from 'dayjs'

import dayjs from '@/lib/dayjs'
```

## Available Plugins

- **customParseFormat** — strict parsing with a format string (`dayjs(str, format)`)
- **relativeTime** — `fromNow()`, `from()`, `to()`, `toNow()`
- **localizedFormat** — locale-aware format tokens (`L`, `LL`, `LLL`, `LLLL`, `LT`, `LTS`)
- **isoWeek** — ISO week methods: `startOf('isoWeek')`, `isoWeekday()`, `isoWeek()`

## Helpers & Constants

Exported from `@/lib/dayjs` alongside the default `dayjs` export:

- **`ISO_DATE_FORMAT`** — `'YYYY-MM-DD'` constant for consistent date storage/serialization
- **`toISODate(date)`** — formats any date input to `'YYYY-MM-DD'` string
- **`fromISODate(dateString)`** — parses a `'YYYY-MM-DD'` string into a dayjs instance

```ts
import dayjs, { fromISODate, ISO_DATE_FORMAT, toISODate } from '@/lib/dayjs'

toISODate(new Date()) // "2026-02-12"
fromISODate('2026-02-12') // dayjs object
```

### Calendar & Date Helpers

Also exported from `@/lib/dayjs`:

- **`getWeekDays(date)`** — returns 7 dayjs objects (Mon–Sun) for the ISO week containing `date`
- **`getMonthGrid(year, month)`** — returns 42 `{ date, isCurrentMonth }` objects for a 6-row calendar grid starting from the Monday of the week that contains the 1st of the month
- **`isToday(date)`** — returns `true` if `date` matches today (day-level comparison)

```ts
import dayjs, { getMonthGrid, getWeekDays, isToday } from '@/lib/dayjs'

getWeekDays(dayjs()) // [Mon, Tue, ..., Sun] as dayjs objects
getMonthGrid(2026, 1) // 42 cells for February 2026 (month is 0-indexed)
isToday(dayjs()) // true
```

## Common Patterns

```ts
dayjs(date).fromNow() // "3 hours ago"
dayjs(date).format('L') // "02/12/2026" (locale short date)
dayjs(date).format('LL') // "February 12, 2026" (locale long date)
dayjs(date).format('MMM D') // "Feb 12"
dayjs(date).format('LT') // "2:30 PM" (locale time)
```

## Adding New Plugins

If you need a new dayjs plugin, add it to `src/lib/dayjs.ts` and document it here.
