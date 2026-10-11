import { addDays, addWeeks, format, isValid, parseISO, startOfWeek } from "date-fns";

/** Dates are interpreted in the server's local timezone (set TZ, e.g. Asia/Shanghai). */
export function toISODate(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export function todayISO(now = new Date()) {
  return toISODate(now);
}

export function isISODate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && isValid(parseISO(value));
}

/** Monday of the week containing `d`. */
export function weekStartISO(d: Date | string = new Date()) {
  const date = typeof d === "string" ? parseISO(d) : d;
  return toISODate(startOfWeek(date, { weekStartsOn: 1 }));
}

/** Half-open [start, end) range of the week beginning at `weekStart`. */
export function weekRange(weekStart: string) {
  const start = parseISO(weekStart);
  return { start, end: addWeeks(start, 1) };
}

export function shiftWeek(weekStart: string, weeks: number) {
  return toISODate(addWeeks(parseISO(weekStart), weeks));
}

export function weekEndISO(weekStart: string) {
  return toISODate(addDays(parseISO(weekStart), 6));
}

export function formatShortDate(iso: string) {
  return format(parseISO(iso), "M月d日");
}

/** Days from today until `iso` (negative = overdue). */
export function daysUntil(iso: string, now = new Date()) {
  const a = parseISO(todayISO(now)).getTime();
  const b = parseISO(iso).getTime();
  return Math.round((b - a) / 86_400_000);
}
