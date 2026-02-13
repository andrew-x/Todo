import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isoWeek from 'dayjs/plugin/isoWeek'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(customParseFormat)
dayjs.extend(relativeTime)
dayjs.extend(localizedFormat)
dayjs.extend(isoWeek)

export const ISO_DATE_FORMAT = 'YYYY-MM-DD'

export function toISODate(date: dayjs.ConfigType): string {
  return dayjs(date).format(ISO_DATE_FORMAT)
}

export function fromISODate(dateString: string): dayjs.Dayjs {
  return dayjs(dateString, ISO_DATE_FORMAT)
}

/** Returns 7 Dayjs objects (Mon–Sun) for the week containing `date`. */
export function getWeekDays(date: dayjs.Dayjs): dayjs.Dayjs[] {
  const monday = date.startOf('isoWeek')
  return Array.from({ length: 7 }, (_, i) => monday.add(i, 'day'))
}

/** Returns array of { date, isCurrentMonth } for a 6-row calendar grid (42 cells). */
export function getMonthGrid(
  year: number,
  month: number,
): { date: dayjs.Dayjs; isCurrentMonth: boolean }[] {
  const firstOfMonth = dayjs().year(year).month(month).startOf('month')
  const startDate = firstOfMonth.startOf('isoWeek')

  return Array.from({ length: 42 }, (_, i) => {
    const date = startDate.add(i, 'day')
    return { date, isCurrentMonth: date.month() === month }
  })
}

/** Shorthand for checking if a date is today. */
export function isToday(date: dayjs.Dayjs): boolean {
  return date.isSame(dayjs(), 'day')
}

export default dayjs
