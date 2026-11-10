"use client"

import * as React from "react"

import {
  MotionValue,
  motion,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import clsx, { type ClassValue } from "clsx";

const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

/** Breathing room above and below the glyphs, in px. */
const PADDING = 10;

/**
 * Height of one digit box, expressed against the element's own font size so
 * the counter stays correct at any responsive size.
 */
const DIGIT_HEIGHT = `calc(1em + ${PADDING}px)`;

/** Digit places, most significant first. */
const PLACES = [100000, 10000, 1000, 100, 10, 1] as const;

type Cell =
  | { type: "digit"; place: number }
  | { type: "separator" };

/**
 * The digit places needed for a given value, most significant first.
 * The ones digit is always present, even at 0.
 */
function placesFor(value: number): number[] {
  const places = PLACES.filter((place) => value >= place);
  return places.length ? [...places] : [1];
}

/**
 * Lay the digits out in thousands, e.g. 1200 -> "1,200".
 *
 * Groups are counted from the right, so a separator always sits in the
 * correct place for the number currently being displayed.
 */
function buildCells(places: readonly number[], separator?: string): Cell[] {
  const cells: Cell[] = [];

  places.forEach((place, index) => {
    // A separator precedes every third digit from the right.
    if (separator && index > 0 && Math.log10(place) % 3 === 2) {
      cells.push({ type: "separator" });
    }
    cells.push({ type: "digit", place });
  });

  return cells;
}

interface CounterProps
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLParagraphElement>,
    HTMLParagraphElement
  > {
  start?: number;
  end: number;
  /** Total run time of the count, in seconds. */
  duration?: number;
  className?: string;
  /** Fixed font size in px. Omit to inherit from CSS (e.g. `text-5xl`). */
  fontSize?: number;
  /** Gate the count on an external condition (e.g. the page finishing loading). */
  active?: boolean;
  /** Wait this many ms after `active` flips before the count starts. */
  delay?: number;
  /** Thousands separator, e.g. ",". */
  separator?: string;
  /** Rendered after the digits, e.g. "+". */
  suffix?: React.ReactNode;
  /** Fires once when the counter reaches `end`. */
  onComplete?: () => void;
  /** Fires on every tick with the current value. */
  onValueChange?: (value: number) => void;
}

export const Counter = ({
  start = 0,
  end,
  duration = end,
  className,
  fontSize,
  active = true,
  delay = 0,
  separator,
  suffix,
  onComplete,
  onValueChange,
  style,
  ...rest
}: CounterProps) => {
  const reducedMotion = useReducedMotion();
  const completedRef = useRef(false);
  const startedRef = useRef(false);

  // Callbacks are read through refs so an inline arrow from the parent does
  // not retrigger the effects below on every render.
  const onCompleteRef = useRef(onComplete);
  const onValueChangeRef = useRef(onValueChange);
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onValueChangeRef.current = onValueChange;
  });

  // Cases that need no animation resolve to a fixed value during render
  // rather than through a state update inside an effect.
  const animates = active && end > start && !reducedMotion;

  // Only holds a value while the count is actually running.
  const [countValue, setCountValue] = useState<number | null>(null);

  const value = animates ? (countValue ?? start) : active ? end : start;

  useEffect(() => {
    if (!active) return;

    startedRef.current = true;

    if (!animates) return;

    const total = Math.max(duration, 0.001) * 1000;

    // Time-driven rather than tick-driven: browsers clamp setInterval, which
    // makes a tick counter overshoot its stated duration.
    const run = () => {
      const startedAt = performance.now();
      let frame = 0;

      const tick = (now: number) => {
        const progress = Math.min((now - startedAt) / total, 1);
        setCountValue(Math.min(start + Math.round(progress * (end - start)), end));

        if (progress < 1) {
          frame = requestAnimationFrame(tick);
        }
      };

      frame = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(frame);
    };

    if (delay > 0) {
      const delayTimer = setTimeout(run, delay);
      return () => clearTimeout(delayTimer);
    }

    return run();
  }, [active, animates, end, start, duration, delay]);

  useEffect(() => {
    onValueChangeRef.current?.(value);
  }, [value]);

  useEffect(() => {
    if (startedRef.current && value >= end && !completedRef.current) {
      completedRef.current = true;
      onCompleteRef.current?.();
    }
  }, [value, end]);

  // Digits are derived from the current value, so the number reads correctly
  // the whole way up ("12" never becomes "0,012").
  const cells = buildCells(placesFor(value), separator);

  return (
    <div
      style={fontSize ? { fontSize, ...style } : style}
      {...rest}
      className={cn(
        "flex overflow-hidden rounded px-2 leading-none text-primary font-bold ",
        className
      )}
    >
      {cells.map((cell, index) =>
        cell.type === "separator" ? (
          <span
            key={`separator-${index}`}
            aria-hidden="true"
            className="inline-flex shrink-0 items-center justify-center"
            style={{ height: DIGIT_HEIGHT }}
          >
            {separator}
          </span>
        ) : (
          <Digit
            key={cell.place}
            place={cell.place}
            value={value}
            reducedMotion={!!reducedMotion}
          />
        )
      )}

      {suffix != null && (
        <span
          aria-hidden="true"
          className="inline-flex shrink-0 items-center justify-center"
          style={{ height: DIGIT_HEIGHT }}
        >
          {suffix}
        </span>
      )}
    </div>
  );
};

function Digit({
  place,
  value,
  reducedMotion,
}: {
  place: number;
  value: number;
  reducedMotion: boolean;
}) {
  const valueRoundedToPlace = Math.floor(value / place);
  const animatedValue = useSpring(valueRoundedToPlace);

  useEffect(() => {
    // `jump` sets the value without animating - used for reduced motion.
    if (reducedMotion) {
      animatedValue.jump(valueRoundedToPlace);
    } else {
      animatedValue.set(valueRoundedToPlace);
    }
  }, [animatedValue, valueRoundedToPlace, reducedMotion]);

  return (
    <div style={{ height: DIGIT_HEIGHT }} className="relative w-[1ch] tabular-nums">
      {[...Array(10)].map((_, i) => (
        <Number key={i} mv={animatedValue} number={i} />
      ))}
    </div>
  );
}

function Number({ mv, number }: { mv: MotionValue; number: number }) {
  const y = useTransform(mv, (latest) => {
    const placeValue = latest % 10;
    const offset = (10 + number - placeValue) % 10;

    let steps = offset;
    if (offset > 5) {
      steps -= 10;
    }

    // One step is exactly one digit box tall.
    return `calc(${steps} * (1em + ${PADDING}px))`;
  });

  return (
    <motion.span
      style={{ y }}
      className="absolute inset-0 flex items-center justify-center"
    >
      {number}
    </motion.span>
  );
}
