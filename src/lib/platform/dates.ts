/**
 * Dates, formatted the same way everywhere.
 *
 * `toLocaleDateString()` is the obvious thing to reach for and it is
 * wrong here: the server and the browser do not always agree on the
 * locale, so a date written as 09/12/2026 on the server comes back as
 * 9/12/2026 in the browser and React throws a hydration error.
 *
 * These helpers build the string from the parts instead, so the server and
 * the client always produce the same thing.
 */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * A date as `12 Nov 2026`.
 */
export function formatDate(value: string | number | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return "";
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/**
 * A date as `12 Nov 2026, 14:05`.
 */
export function formatDateTime(
  value: string | number | Date | null | undefined,
): string {
  const date = toDate(value);
  if (!date) return "";
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${formatDate(date)}, ${hours}:${minutes}`;
}

/**
 * The number of days from now until a deadline.
 */
export function daysUntil(
  value: string | number | Date | null | undefined,
  now: number,
): number | null {
  const date = toDate(value);
  if (!date) return null;
  return Math.ceil((date.getTime() - now) / 86400000);
}

/**
 * Turns whatever it is given into a date, or null.
 */
function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
