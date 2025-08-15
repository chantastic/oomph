import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to check if an assignment should appear on a specific date
export function shouldShowAssignmentOnDate(cronSchedule: string, date: Date): boolean {
  // Evaluate whether a given date is included by a cron expression.
  // We only consider month/day-of-month/day-of-week so that any time on that day counts.

  const lower = cronSchedule.trim().toLowerCase()

  // Support common macros and friendly aliases
  const macroMap: Record<string, string> = {
    '@yearly': '0 0 1 1 *',
    '@annually': '0 0 1 1 *',
    '@monthly': '0 0 1 * *',
    '@weekly': '0 0 * * 0',
    '@daily': '0 0 * * *',
    '@midnight': '0 0 * * *',
    '@hourly': '0 * * * *',
    '@weekday': '0 0 * * 1-5',
    'daily': '0 0 * * *',
    'weekly': '0 0 * * 0',
    'monthly': '0 0 1 * *'
  }

  const normalized = macroMap[lower] ?? lower

  // Some crons include seconds (6 fields). If so, ignore seconds.
  const parts = normalized.split(/\s+/).filter(Boolean)
  const fields = parts.length === 6 ? parts.slice(1) : parts
  if (fields.length !== 5) {
    // Unknown format – default to showing (fail-open for visibility)
    return true
  }

  // Fields: minute hour dayOfMonth month dayOfWeek
  const [/*minute*/, /*hour*/, dom, mon, dow] = fields

  // Month mapping for names
  const monthNameToNumber: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
  }
  // Day-of-week mapping for names (0 or 7 is Sunday)
  const dowNameToNumber: Record<string, number> = {
    sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6
  }

  function parseListRangeStep(
    field: string,
    min: number,
    max: number,
    nameMap?: Record<string, number>,
    normalize?: (n: number) => number
  ): (value: number) => boolean {
    if (field === '*') return () => true

    const segments = field.split(',')

    const allowed: number[] = []
    for (const seg of segments) {
      const [rangePart, stepPart] = seg.split('/')
      const step = stepPart ? Math.max(1, parseInt(stepPart, 10)) : 1

      const resolveToken = (token: string): number | null => {
        const t = token.trim().toLowerCase()
        if (t === '*') return null
        if (nameMap && t in nameMap) return nameMap[t]
        const n = parseInt(t, 10)
        if (!isNaN(n)) return n
        return null
      }

      if (rangePart.includes('-')) {
        const [aTok, bTok] = rangePart.split('-')
        const aRaw = resolveToken(aTok)
        const bRaw = resolveToken(bTok)
        if (aRaw == null || bRaw == null) continue
        const a = Math.max(min, Math.min(max, aRaw))
        const b = Math.max(min, Math.min(max, bRaw))
        const start = Math.min(a, b)
        const end = Math.max(a, b)
        for (let v = start; v <= end; v += step) {
          allowed.push(normalize ? normalize(v) : v)
        }
      } else if (rangePart === '*') {
        for (let v = min; v <= max; v += step) {
          allowed.push(normalize ? normalize(v) : v)
        }
      } else {
        const single = resolveToken(rangePart)
        if (single != null) {
          const v = Math.max(min, Math.min(max, single))
          if ((v - min) % step === 0) {
            allowed.push(normalize ? normalize(v) : v)
          }
        }
      }
    }

    const set = new Set(allowed)
    return (value: number) => set.has(normalize ? normalize(value) : value)
  }

  const jsMonth = date.getMonth() + 1 // 1-12
  const jsDom = date.getDate() // 1-31
  const jsDow = date.getDay() // 0-6, Sunday=0

  // Month matcher
  const monthMatches = parseListRangeStep(mon, 1, 12, monthNameToNumber)
  const isMonthOk = monthMatches(jsMonth)
  if (!isMonthOk) return false

  // Day-of-month matcher
  const domMatches = parseListRangeStep(dom, 1, 31)
  const domIsAny = dom === '*'
  const domOk = domMatches(jsDom)

  // Day-of-week matcher (accept 0 or 7 for Sunday and names)
  const dowMatches = parseListRangeStep(
    dow,
    0,
    7,
    dowNameToNumber,
    (n) => (n === 7 ? 0 : n)
  )
  const dowIsAny = dow === '*'
  const dowOk = dowMatches(jsDow)

  // Vixie cron semantics: if both DOM and DOW are restricted (not *), match if EITHER matches.
  // If one is '*', the other controls.
  if (!domIsAny && !dowIsAny) {
    return domOk || dowOk
  }
  if (!domIsAny) return domOk
  if (!dowIsAny) return dowOk
  return true
}

// Helper function to get week dates
export function getWeekDates(startDate?: Date): Date[] {
  const today = startDate || new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday
  
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    weekDates.push(date);
  }
  return weekDates;
}

// Helper function to check if a date is today
export function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}
