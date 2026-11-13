"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { IconLayoutNavbarCollapse } from "@tabler/icons-react";
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

import { useRef, useState } from "react";

export interface FloatingDockItem {
  title: string;
  icon: React.ReactNode;
  /** Omit to render a non-navigating button. */
  href?: string;
  external?: boolean;
}

export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName,
}: {
  items: FloatingDockItem[];
  desktopClassName?: string;
  mobileClassName?: string;
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName} />
      <FloatingDockMobile items={items} className={mobileClassName} />
    </>
  );
};

const FloatingDockMobile = ({
  items,
  className,
}: {
  items: FloatingDockItem[];
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("relative block md:hidden", className)}>
      <AnimatePresence>
        {open && (
          <motion.div
            layoutId="nav"
            className="absolute inset-x-0 bottom-full mb-3 flex flex-col items-center gap-2.5"
          >
            {items.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  y: 10,
                  scale: 0.8,
                  transition: { delay: idx * 0.04 },
                }}
                transition={{ delay: (items.length - 1 - idx) * 0.04 }}
              >
                <DockItemLink
                  item={item}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-emptiness)] border border-[var(--color-spotted-dove)] shadow-md text-[var(--color-iron-fixture)] hover:text-[var(--color-caviar)] hover:border-[var(--color-caviar)] transition-colors"
                >
                  <div className="h-5 w-5 flex items-center justify-center">{item.icon}</div>
                </DockItemLink>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Toggle Dock Menu"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-caviar)] border border-[var(--color-caviar)] shadow-xl text-[var(--color-emptiness)] hover:scale-105 transition-transform"
      >
        <IconLayoutNavbarCollapse className="h-6 w-6" />
      </button>
    </div>
  );
};

const FloatingDockDesktop = ({
  items,
  className,
}: {
  items: FloatingDockItem[];
  className?: string;
}) => {
  const mouseX = useMotionValue(Infinity);
  // The magnification follows the pointer on every move. For anyone who
  // has asked for reduced motion the pointer is not fed in, so every icon
  // rests at its normal size; the tooltips and colour changes still work.
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      onMouseMove={(e) => {
        if (!reduceMotion) mouseX.set(e.pageX);
      }}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "mx-auto hidden h-16 items-end gap-3.5 rounded-full border border-[var(--color-spotted-dove)] bg-[var(--color-emptiness)]/90 px-4 pb-2.5 backdrop-blur-md shadow-lg md:flex",
        className,
      )}
    >
      {items.map((item) => (
        <IconContainer mouseX={mouseX} key={item.title} {...item} />
      ))}
    </motion.div>
  );
};

/**
 * Renders a link when the item has an href, otherwise a plain button that
 * does not navigate anywhere.
 *
 * Internal routes use next/link so navigation stays client-side; external
 * ones fall back to a plain anchor with target="_blank".
 */
function DockItemLink({
  item,
  className,
  children,
}: {
  item: FloatingDockItem;
  className?: string;
  children?: React.ReactNode;
}) {
  if (!item.href) {
    return (
      <button
        type="button"
        aria-label={item.title}
        aria-disabled="true"
        className={className}
      >
        {children}
      </button>
    );
  }

  const isInternal = item.href.startsWith("/") && !item.external;

  if (isInternal) {
    return (
      <Link href={item.href} aria-label={item.title} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={item.href}
      target={item.external ? "_blank" : undefined}
      rel={item.external ? "noreferrer noopener" : undefined}
      aria-label={item.title}
      className={className}
    >
      {children}
    </a>
  );
}

function IconContainer({
  mouseX,
  title,
  icon,
  href,
  external,
}: FloatingDockItem & { mouseX: MotionValue }) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthTransform = useTransform(distance, [-150, 0, 150], [40, 70, 40]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [40, 70, 40]);

  const widthTransformIcon = useTransform(distance, [-150, 0, 150], [20, 34, 20]);
  const heightTransformIcon = useTransform(distance, [-150, 0, 150], [20, 34, 20]);

  const width = useSpring(widthTransform, { mass: 0.1, stiffness: 150, damping: 12 });
  const height = useSpring(heightTransform, { mass: 0.1, stiffness: 150, damping: 12 });

  const widthIcon = useSpring(widthTransformIcon, { mass: 0.1, stiffness: 150, damping: 12 });
  const heightIcon = useSpring(heightTransformIcon, { mass: 0.1, stiffness: 150, damping: 12 });

  const [hovered, setHovered] = useState(false);

  return (
    <DockItemLink item={{ title, icon, href, external }}>
      <motion.div
        ref={ref}
        style={{ width, height }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative flex aspect-square items-center justify-center rounded-full bg-[var(--color-night-white)] border border-[var(--color-spotted-dove)] text-[var(--color-iron-fixture)] transition-colors hover:border-[var(--color-caviar)] hover:text-[var(--color-caviar)]"
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 2, x: "-50%" }}
              className="absolute -top-9 left-1/2 w-fit rounded-lg border border-[var(--color-spotted-dove)] bg-[var(--color-caviar)] px-2.5 py-1 text-xs font-medium whitespace-pre text-[var(--color-emptiness)] shadow-md"
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className="flex items-center justify-center"
        >
          {icon}
        </motion.div>
      </motion.div>
    </DockItemLink>
  );
}
