"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Tabs, for splitting a long panel into parts.
 *
 * The panels that are not showing are hidden rather than unmounted, so a
 * half filled form in one keeps its contents when you look at another.
 * The arrow keys move between tabs, as they do in any tab list.
 */
export function Tabs({
  tabs,
}: {
  tabs: { id: string; label: string; count?: number; content: ReactNode }[];
}) {
  const [active, setActive] = useState(tabs[0]?.id);
  const base = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  // A link elsewhere on the page can point at something inside a tab
  // (href="#resource-…"). The browser cannot scroll to an element in a
  // hidden panel, so the tab it lives in is opened first, then the page
  // glides to it and it flashes once so the eye lands on it. The hash is
  // cleared afterwards, so the same link works when pressed again.
  useEffect(() => {
    const reveal = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const target = id ? document.getElementById(id) : null;
      const panel = target?.closest<HTMLElement>("[data-tab]");
      if (!target || !panel?.dataset.tab) return;

      setActive(panel.dataset.tab);
      history.replaceState(null, "", window.location.pathname + window.location.search);

      requestAnimationFrame(() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
        target.classList.remove("tn-flash");
        // Restart the flash if it is already running.
        void target.offsetWidth;
        target.classList.add("tn-flash");
      });
    };

    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, []);

  const move = (from: number, step: number) => {
    const next = (from + step + tabs.length) % tabs.length;
    setActive(tabs[next].id);
    buttons.current[next]?.focus();
  };

  return (
    <div>
      <div
        role="tablist"
        className="mb-6 flex gap-1 overflow-x-auto border-b border-[var(--color-spotted-dove)]"
      >
        {tabs.map((tab, index) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                buttons.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${base}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight") move(index, 1);
                if (event.key === "ArrowLeft") move(index, -1);
              }}
              className={cn(
                "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-semibold transition-colors duration-150",
                selected
                  ? "border-[var(--color-plum-bright)] text-[var(--color-caviar)]"
                  : "border-transparent text-[var(--color-iron-fixture)] hover:text-[var(--color-caviar)]",
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold tabular-nums",
                    selected
                      ? "bg-[var(--color-plum-bright)] text-[var(--color-emptiness)]"
                      : "bg-[var(--color-night-white)] text-[var(--color-iron-fixture)]",
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          data-tab={tab.id}
          id={`${base}-panel-${tab.id}`}
          aria-labelledby={`${base}-tab-${tab.id}`}
          hidden={tab.id !== active}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
