"use client";

/**
 * Vendored from Aceternity UI (`components/ui/wavy-background.tsx`).
 *
 * Three lint rules are disabled for this file because the source trips them:
 * it types the canvas handles and the children slot as `any`, declares its
 * loop variable with `var`, and detects Safari with a `setState` inside an
 * effect. The Safari check is left exactly as the source wrote it.
 *
 * The deviations made for this project are marked "DEVIATION FROM SOURCE"
 * below.
 */
/* eslint-disable @typescript-eslint/no-explicit-any, no-var, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";
import { createNoise3D, type NoiseFunction3D } from "simplex-noise";

export const WavyBackground = ({
  children,
  className,
  containerClassName,
  colors,
  waveWidth,
  backgroundFill,
  blur = 10,
  speed = "fast",
  waveOpacity = 0.5,
  ...props
}: {
  children?: any;
  className?: string;
  containerClassName?: string;
  colors?: string[];
  waveWidth?: number;
  backgroundFill?: string;
  blur?: number;
  speed?: "slow" | "fast";
  waveOpacity?: number;
  [key: string]: any;
}) => {
  /**
   * DEVIATION FROM SOURCE: the source builds the noise table during render.
   * simplex-noise seeds that table with Math.random(), which Next.js
   * rejects during prerender as an "unstable value". The table is only
   * ever read by the animation, so it is built when the animation starts.
   */
  let noise: NoiseFunction3D;
  let w: number,
    h: number,
    nt: number,
    i: number,
    x: number,
    ctx: any,
    canvas: any;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef(true);
  const getSpeed = () => {
    switch (speed) {
      case "slow":
        return 0.001;
      case "fast":
        return 0.002;
      default:
        return 0.001;
    }
  };

  /**
   * Canvas colours cannot read CSS custom properties, so a `var(--token)`
   * is resolved against the document before it reaches the 2d context.
   */
  const resolveColor = (color: string) => {
    const match = color.match(/^var\((--[^)]+)\)$/);
    if (!match || typeof window === "undefined") return color;

    return (
      getComputedStyle(document.documentElement)
        .getPropertyValue(match[1])
        .trim() || color
    );
  };

  /**
   * DEVIATION FROM SOURCE: the source sizes the canvas to the viewport.
   * This component is used as a section background, and on a tall display the
   * viewport's vertical centre lands outside the section, so the waves would
   * not be visible at all. The source's own comment says "currently at 50%
   * of the container", so the container is what gets measured.
   */
  const sizeCanvas = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect?.width || window.innerWidth));
    const height = Math.max(1, Math.round(rect?.height || window.innerHeight));

    w = ctx.canvas.width = width;
    h = ctx.canvas.height = height;
    ctx.filter = `blur(${blur}px)`;
  };

  const init = () => {
    canvas = canvasRef.current;
    ctx = canvas.getContext("2d");
    noise = createNoise3D();
    sizeCanvas();
    nt = 0;
    render();
  };

  const waveColors = (colors ?? [
    "#38bdf8",
    "#818cf8",
    "#c084fc",
    "#e879f9",
    "#22d3ee",
  ]).map(resolveColor);
  const drawWave = (n: number) => {
    nt += getSpeed();
    for (i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.lineWidth = waveWidth || 50;
      ctx.strokeStyle = waveColors[i % waveColors.length];
      for (x = 0; x < w; x += 5) {
        var y = noise(x / 800, 0.3 * i, nt) * 100;
        ctx.lineTo(x, y + h * 0.5); // adjust for height, currently at 50% of the container
      }
      ctx.stroke();
      ctx.closePath();
    }
  };

  let animationId: number;
  const render = () => {
    if (!isVisibleRef.current) return;

    /**
     * DEVIATION FROM SOURCE: the source relies on `backgroundFill` to clear
     * the canvas each frame. With a transparent fill nothing is cleared, so
     * every frame's strokes accumulate on top of the last and the waves
     * saturate into a solid band within a second. Clear the canvas
     * explicitly, then fill it.
     */
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = backgroundFill || "black";
    ctx.globalAlpha = waveOpacity || 0.5;
    ctx.fillRect(0, 0, w, h);
    drawWave(5);
    animationId = requestAnimationFrame(render);
  };

  useEffect(() => {
    init();

    /**
     * DEVIATION FROM SOURCE: the source assigns `window.onresize`, which
     * replaces any other handler the page may have installed. A
     * ResizeObserver on the container covers both window and container
     * resizes without taking the global handler over.
     */
    const resizeObserver = new ResizeObserver(() => sizeCanvas());
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    /**
     * DEVIATION FROM SOURCE: the source animates forever, even once the
     * section has scrolled out of view. Repainting a full-size blurred
     * canvas 60 times a second in the background is pure waste, so the
     * loop is paused while the container is off screen.
     */
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;

        cancelAnimationFrame(animationId);
        if (isVisibleRef.current) render();
      },
      { threshold: 0 },
    );
    if (containerRef.current) visibilityObserver.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
    };
  }, []);

  const [isSafari, setIsSafari] = useState(false);
  useEffect(() => {
    // I'm sorry but i have got to support it on safari.
    setIsSafari(
      typeof window !== "undefined" &&
        navigator.userAgent.includes("Safari") &&
        !navigator.userAgent.includes("Chrome"),
    );
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "h-screen flex flex-col items-center justify-center",
        containerClassName,
      )}
    >
      <canvas
        className="absolute inset-0 z-0"
        ref={canvasRef}
        id="canvas"
        style={{
          ...(isSafari ? { filter: `blur(${blur}px)` } : {}),
        }}
      ></canvas>
      <div className={cn("relative z-10", className)} {...props}>
        {children}
      </div>
    </div>
  );
};
