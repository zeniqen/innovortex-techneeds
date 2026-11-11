"use client";

import { useRef } from "react";

import { avatarSpec } from "@/lib/platform/ai/avatar";

/**
 * The generative crest.
 *
 * The marks shift away from the pointer as it moves over the crest, each
 * one by a different amount, so the picture has a little depth. The shift
 * is written straight to the element as two custom properties rather than
 * through React state, so moving the pointer never re-renders anything.
 */
export function Crest({
  seed,
  className,
}: {
  seed: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const spec = avatarSpec(seed);

  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    const element = ref.current;
    if (!element) return;

    const box = element.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;

    element.style.setProperty("--crest-x", `${(-x * 14).toFixed(2)}px`);
    element.style.setProperty("--crest-y", `${(-y * 14).toFixed(2)}px`);
  };

  const reset = () => {
    ref.current?.style.setProperty("--crest-x", "0px");
    ref.current?.style.setProperty("--crest-y", "0px");
  };

  return (
    <div
      ref={ref}
      onPointerMove={move}
      onPointerLeave={reset}
      className={className}
      style={
        {
          "--crest-x": "0px",
          "--crest-y": "0px",
        } as React.CSSProperties
      }
    >
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        role="presentation"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="100" height="100" rx="22" fill={spec.background} />
        {spec.marks.map((mark, index) => {
          const depth = 1 + (index % 3);
          const transform = `translate(calc(var(--crest-x, 0px) * ${depth}), calc(var(--crest-y, 0px) * ${depth}))`;

          if (mark.shape === "circle") {
            return (
              <circle
                key={index}
                cx={mark.x + mark.side / 2}
                cy={mark.y + mark.side / 2}
                r={mark.side / 2}
                fill={mark.fill}
                style={{ transform, transition: "transform 120ms cubic-bezier(0.4, 0, 0.2, 1)" }}
              />
            );
          }

          if (mark.shape === "square") {
            return (
              <rect
                key={index}
                x={mark.x}
                y={mark.y}
                width={mark.side}
                height={mark.side}
                rx={mark.side * 0.28}
                fill={mark.fill}
                style={{ transform, transition: "transform 120ms cubic-bezier(0.4, 0, 0.2, 1)" }}
              />
            );
          }

          return (
            <polygon
              key={index}
              points={`${mark.x + mark.side / 2},${mark.y + mark.side} ${mark.x + mark.side},${mark.y} ${mark.x},${mark.y}`}
              fill={mark.fill}
              style={{ transform, transition: "transform 120ms cubic-bezier(0.4, 0, 0.2, 1)" }}
            />
          );
        })}
      </svg>
    </div>
  );
}
