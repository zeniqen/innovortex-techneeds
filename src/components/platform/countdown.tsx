"use client";

import { useEffect, useState } from "react";

/**
 * How long until a deadline, kept up to date.
 *
 * The first render uses the time the server rendered at, so the server and
 * the browser print the same words; after that it ticks once a minute,
 * which is as fine as the words get.
 */
export function Countdown({
  deadline,
  serverNow,
}: {
  deadline: string;
  serverNow: number;
}) {
  const [now, setNow] = useState(serverNow);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return <>{describe(new Date(deadline).getTime() - now)}</>;
}

/**
 * "due in 2 days 4 hours", "due in 35 minutes", "3 days overdue".
 */
function describe(ms: number): string {
  const late = ms < 0;
  const minutes = Math.floor(Math.abs(ms) / 60_000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;

  const unit = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
  const span =
    days > 0
      ? `${unit(days, "day")}${hours ? ` ${unit(hours, "hour")}` : ""}`
      : hours > 0
        ? `${unit(hours, "hour")}${mins ? ` ${unit(mins, "minute")}` : ""}`
        : unit(Math.max(mins, 1), "minute");

  return late ? `${span} overdue` : `due in ${span}`;
}
