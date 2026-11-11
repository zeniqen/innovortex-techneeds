"use client";

import React, {
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
} from "react";
import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

interface MousePosition {
  x: number;
  y: number;
}

/**
 * Particles drifting behind a piece of content.
 *
 * The particles drift, fade in as they come away from the edge, and lean
 * towards the pointer.
 *
 * This is the upstream Magic UI component with three changes:
 *
 *  - the pointer is kept in a ref rather than in state. The upstream
 *    version puts the pointer position in state and re-renders the whole
 *    component on every mouse move, which on a page that already has a
 *    custom cursor is a re-render per event for nothing.
 *  - nothing is assigned to a ref or randomised during a render. The
 *    functions are built inside the effect that uses them.
 *  - it stands down for anyone who has asked for reduced motion: the
 *    particles are drawn once and stay where they are.
 */

interface ParticlesProps extends ComponentPropsWithoutRef<"div"> {
  className?: string;
  quantity?: number;
  staticity?: number;
  ease?: number;
  size?: number;
  refresh?: boolean;
  color?: string;
  vx?: number;
  vy?: number;
}

function hexToRgb(hex: string): number[] {
  hex = hex.replace("#", "");

  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  const hexInt = parseInt(hex, 16);
  const red = (hexInt >> 16) & 255;
  const green = (hexInt >> 8) & 255;
  const blue = hexInt & 255;
  return [red, green, blue];
}

type Circle = {
  x: number;
  y: number;
  translateX: number;
  translateY: number;
  size: number;
  alpha: number;
  targetAlpha: number;
  dx: number;
  dy: number;
  magnetism: number;
};

export const Particles: React.FC<ParticlesProps> = ({
  className = "",
  quantity = 100,
  staticity = 50,
  ease = 50,
  size = 0.4,
  refresh = false,
  color = "#ffffff",
  vx = 0,
  vy = 0,
  ...props
}) => {
  const reduceMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const circles = useRef<Circle[]>([]);
  const mouse = useRef<MousePosition>({ x: 0, y: 0 });
  const canvasSize = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;
  const rafID = useRef<number | null>(null);
  const resizeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    context.current = ctx;
    const rgb = hexToRgb(color);

    const circleParams = (): Circle => {
      const x = Math.floor(Math.random() * canvasSize.current.w);
      const y = Math.floor(Math.random() * canvasSize.current.h);
      const pSize = Math.floor(Math.random() * 2) + size;
      const targetAlpha = parseFloat((Math.random() * 0.6 + 0.1).toFixed(1));
      return {
        x,
        y,
        translateX: 0,
        translateY: 0,
        size: pSize,
        alpha: 0,
        targetAlpha,
        dx: (Math.random() - 0.5) * 0.1,
        dy: (Math.random() - 0.5) * 0.1,
        magnetism: 0.1 + Math.random() * 4,
      };
    };

    const drawCircle = (circle: Circle, update = false) => {
      if (!context.current) return;
      const { x, y, translateX, translateY, size, alpha } = circle;

      // The offset is added to the position rather than applied as a
      // transform. The upstream version translates the context and resets
      // it for every particle, which is two matrix operations per particle
      // per frame for the same result.
      context.current.beginPath();
      context.current.arc(x + translateX, y + translateY, size, 0, 2 * Math.PI);
      context.current.fillStyle = `rgba(${rgb.join(", ")}, ${alpha})`;
      context.current.fill();

      if (!update) {
        circles.current.push(circle);
      }
    };

    const clearContext = () => {
      if (!context.current) return;
      context.current.clearRect(
        0,
        0,
        canvasSize.current.w,
        canvasSize.current.h,
      );
    };

    const drawParticles = () => {
      clearContext();
      for (let i = 0; i < quantity; i++) {
        drawCircle(circleParams());
      }
    };

    const resizeCanvas = () => {
      if (!canvasContainerRef.current || !canvasRef.current || !context.current) {
        return;
      }
      canvasSize.current.w = canvasContainerRef.current.offsetWidth;
      canvasSize.current.h = canvasContainerRef.current.offsetHeight;

      canvasRef.current.width = canvasSize.current.w * dpr;
      canvasRef.current.height = canvasSize.current.h * dpr;
      canvasRef.current.style.width = `${canvasSize.current.w}px`;
      canvasRef.current.style.height = `${canvasSize.current.h}px`;
      context.current.scale(dpr, dpr);

      circles.current = [];
      for (let i = 0; i < quantity; i++) {
        drawCircle(circleParams());
      }
    };

    const remapValue = (
      value: number,
      start1: number,
      end1: number,
      start2: number,
      end2: number,
    ): number => {
      const remapped =
        ((value - start1) * (end2 - start2)) / (end1 - start1) + start2;
      return remapped > 0 ? remapped : 0;
    };

    const animate = () => {
      clearContext();

      circles.current.forEach((circle: Circle, i: number) => {
        // How far the particle is from the edge of the canvas.
        const edge = [
          circle.x + circle.translateX - circle.size,
          canvasSize.current.w - circle.x - circle.translateX - circle.size,
          circle.y + circle.translateY - circle.size,
          canvasSize.current.h - circle.y - circle.translateY - circle.size,
        ];
        const closestEdge = edge.reduce((a, b) => Math.min(a, b));
        const remapClosestEdge = parseFloat(
          remapValue(closestEdge, 0, 20, 0, 1).toFixed(2),
        );

        if (remapClosestEdge > 1) {
          circle.alpha += 0.02;
          if (circle.alpha > circle.targetAlpha) {
            circle.alpha = circle.targetAlpha;
          }
        } else {
          circle.alpha = circle.targetAlpha * remapClosestEdge;
        }

        circle.x += circle.dx + vx;
        circle.y += circle.dy + vy;
        circle.translateX =
          (mouse.current.x / (staticity / circle.magnetism) -
            circle.translateX) /
          ease;
        circle.translateY =
          (mouse.current.y / (staticity / circle.magnetism) -
            circle.translateY) /
          ease;

        drawCircle(circle, true);

        // A particle that has drifted off the canvas is replaced.
        if (
          circle.x < -circle.size ||
          circle.x > canvasSize.current.w + circle.size ||
          circle.y < -circle.size ||
          circle.y > canvasSize.current.h + circle.size
        ) {
          circles.current.splice(i, 1);
          drawCircle(circleParams());
        }
      });

      rafID.current = window.requestAnimationFrame(animate);
    };

    const initCanvas = () => {
      resizeCanvas();
      drawParticles();
    };

    initRef.current = initCanvas;

    const handleMouseMove = (event: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const { w, h } = canvasSize.current;
      const x = event.clientX - rect.left - w / 2;
      const y = event.clientY - rect.top - h / 2;
      const inside = x < w / 2 && x > -w / 2 && y < h / 2 && y > -h / 2;

      if (inside) {
        mouse.current.x = x;
        mouse.current.y = y;
      }
    };

    const handleResize = () => {
      if (resizeTimeout.current) {
        clearTimeout(resizeTimeout.current);
      }
      resizeTimeout.current = setTimeout(() => {
        initCanvas();
      }, 200);
    };

    initCanvas();

    // With reduced motion the particles are drawn once and stay put.
    if (!reduceMotion) {
      animate();
      window.addEventListener("mousemove", handleMouseMove);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      if (rafID.current != null) {
        window.cancelAnimationFrame(rafID.current);
      }
      if (resizeTimeout.current) {
        clearTimeout(resizeTimeout.current);
      }
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, [color, quantity, staticity, ease, size, vx, vy, reduceMotion, dpr]);

  useEffect(() => {
    if (refresh) {
      initRef.current?.();
    }
  }, [refresh]);

  return (
    <div
      className={cn("pointer-events-none", className)}
      ref={canvasContainerRef}
      aria-hidden="true"
      {...props}
    >
      <canvas ref={canvasRef} className="size-full" />
    </div>
  );
};
