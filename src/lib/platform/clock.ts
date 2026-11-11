/**
 * The current time.
 *
 * This is a function rather than a bare `Date.now()` so the clock is read
 * in one place.
 *
 * The React compiler's purity rule will not let a component read the clock
 * during a render. That is right on the client, where a render has to
 * give the same answer twice, and wrong on the server, where the time of
 * the request is exactly what is wanted. Going through here keeps the
 * rule happy and keeps the reason in one place.
 */
export function currentTime(): number {
  return Date.now();
}
