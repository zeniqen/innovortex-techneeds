"use client";

import { useEffect, useRef, useState, type FC } from "react";
import { motion, useSpring, useReducedMotion } from "motion/react";

interface Position {
  x: number;
  y: number;
}

export interface SmoothCursorProps {
  cursor?: React.ReactNode;
  springConfig?: {
    damping: number;
    stiffness: number;
    mass: number;
    restDelta: number;
  };
}

const DESKTOP_POINTER_QUERY = "(any-hover: hover) and (any-pointer: fine)";

function isTrackablePointer(pointerType: string) {
  return pointerType !== "touch";
}

/**
 * Whether a pointer is over something the person types into.
 *
 * A text caret is more use than an arrow in a field, so the custom cursor
 * gets out of the way there and the native one comes back.
 */
function isTextField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/**
 * The default cursor: an arrow in the site's own ink.
 */
const DefaultCursorSVG: FC = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={50}
      height={54}
      viewBox="0 0 50 54"
      fill="none"
      style={{ scale: 0.5 }}
    >
      <g filter="url(#filter0_d_91_7928)">
        <path
          d="M42.6817 41.1495L27.5103 6.79925C26.7269 5.02557 24.2082 5.02558 23.3927 6.79925L7.59814 41.1495C6.75833 42.9759 8.52712 44.8902 10.4125 44.1954L24.3757 39.0496C24.8829 38.8627 25.4385 38.8627 25.9422 39.0496L39.8121 44.1954C41.6849 44.8902 43.4884 42.9759 42.6817 41.1495Z"
          fill="var(--color-caviar, black)"
        />
        <path
          d="M43.7146 40.6933L28.5431 6.34306C27.3556 3.65428 23.5772 3.69516 22.3668 6.32755L6.57226 40.6778C5.3134 43.4156 7.97238 46.298 10.803 45.2549L24.7662 40.109C25.0221 40.0147 25.2999 40.0156 25.5494 40.1082L39.4193 45.254C42.2261 46.2953 44.9254 43.4347 43.7146 40.6933Z"
          stroke="white"
          strokeWidth={2.25825}
        />
      </g>
      <defs>
        <filter
          id="filter0_d_91_7928"
          x={0.602397}
          y={0.952444}
          width={49.0584}
          height={52.428}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy={2.25825} />
          <feGaussianBlur stdDeviation={2.25825} />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_91_7928"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_91_7928"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  );
};

/**
 * A physics-based cursor that follows the pointer.
 *
 * The pointer position is read on every move but the springs are only
 * given the new position once per frame, so a fast mouse does not queue up
 * work the browser has to catch up on.
 *
 * Two things are different from the upstream component:
 *
 *  - it stands down for anyone who has asked for reduced motion. The
 *    native cursor stays and nothing moves.
 *  - it stands aside over a text field, where the native caret is more
 *    use than an arrow.
 */
export function SmoothCursor({
  cursor = <DefaultCursorSVG />,
  springConfig = {
    damping: 45,
    stiffness: 400,
    mass: 1,
    restDelta: 0.001,
  },
}: SmoothCursorProps) {
  const reduceMotion = useReducedMotion();
  const lastMousePos = useRef<Position>({ x: 0, y: 0 });
  const velocity = useRef<Position>({ x: 0, y: 0 });
  // Zero means "no move yet". The clock is not read during a render, so
  // the first move is skipped rather than measured against the epoch.
  const lastUpdateTime = useRef(0);
  const previousAngle = useRef(0);
  const accumulatedRotation = useRef(0);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const cursorX = useSpring(0, springConfig);
  const cursorY = useSpring(0, springConfig);
  const rotation = useSpring(0, {
    ...springConfig,
    damping: 60,
    stiffness: 300,
  });
  const scale = useSpring(1, {
    ...springConfig,
    stiffness: 500,
    damping: 35,
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_POINTER_QUERY);

    const updateEnabled = () => {
      const nextIsEnabled = mediaQuery.matches;
      setIsEnabled(nextIsEnabled);

      if (!nextIsEnabled) {
        setIsVisible(false);
      }
    };

    updateEnabled();
    mediaQuery.addEventListener("change", updateEnabled);

    return () => {
      mediaQuery.removeEventListener("change", updateEnabled);
    };
  }, []);

  useEffect(() => {
    if (!isEnabled || reduceMotion) {
      return;
    }

    let timeout: ReturnType<typeof setTimeout> | null = null;

    const updateVelocity = (currentPos: Position) => {
      const currentTime = Date.now();
      const deltaTime = currentTime - lastUpdateTime.current;

      if (deltaTime > 0 && lastUpdateTime.current !== 0) {
        velocity.current = {
          x: (currentPos.x - lastMousePos.current.x) / deltaTime,
          y: (currentPos.y - lastMousePos.current.y) / deltaTime,
        };
      }

      lastUpdateTime.current = currentTime;
      lastMousePos.current = currentPos;
    };

    const smoothPointerMove = (e: PointerEvent) => {
      if (!isTrackablePointer(e.pointerType)) {
        return;
      }

      setIsVisible(true);

      const currentPos = { x: e.clientX, y: e.clientY };
      updateVelocity(currentPos);

      const speed = Math.sqrt(
        Math.pow(velocity.current.x, 2) + Math.pow(velocity.current.y, 2),
      );

      cursorX.set(currentPos.x);
      cursorY.set(currentPos.y);

      if (speed > 0.1) {
        const currentAngle =
          Math.atan2(velocity.current.y, velocity.current.x) * (180 / Math.PI) +
          90;

        let angleDiff = currentAngle - previousAngle.current;
        if (angleDiff > 180) angleDiff -= 360;
        if (angleDiff < -180) angleDiff += 360;
        accumulatedRotation.current += angleDiff;
        rotation.set(accumulatedRotation.current);
        previousAngle.current = currentAngle;

        scale.set(0.95);

        if (timeout !== null) {
          clearTimeout(timeout);
        }

        timeout = setTimeout(() => {
          scale.set(1);
        }, 150);
      }
    };

    let rafId = 0;
    const throttledPointerMove = (e: PointerEvent) => {
      if (!isTrackablePointer(e.pointerType)) {
        return;
      }

      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        smoothPointerMove(e);
        rafId = 0;
      });
    };

    const onPointerOver = (e: PointerEvent) => {
      setIsEditing(isTextField(e.target));
    };

    document.body.style.cursor = "none";
    window.addEventListener("pointermove", throttledPointerMove, {
      passive: true,
    });
    window.addEventListener("pointerover", onPointerOver, { passive: true });

    return () => {
      window.removeEventListener("pointermove", throttledPointerMove);
      window.removeEventListener("pointerover", onPointerOver);
      document.body.style.cursor = "auto";
      if (rafId) cancelAnimationFrame(rafId);
      if (timeout !== null) {
        clearTimeout(timeout);
      }
    };
  }, [cursorX, cursorY, rotation, scale, isEnabled, reduceMotion]);

  if (!isEnabled || reduceMotion) {
    return null;
  }

  const shown = isVisible && !isEditing;

  return (
    <motion.div
      style={{
        position: "fixed",
        left: cursorX,
        top: cursorY,
        translateX: "-50%",
        translateY: "-50%",
        rotate: rotation,
        scale: scale,
        zIndex: 100,
        pointerEvents: "none",
        willChange: "transform",
        opacity: shown ? 1 : 0,
      }}
      initial={false}
      animate={{ opacity: shown ? 1 : 0 }}
      transition={{
        duration: 0.15,
      }}
    >
      {cursor}
    </motion.div>
  );
}
