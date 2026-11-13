"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from "react";
import { IconX } from "@tabler/icons-react";

import { cn } from "@/lib/utils";

/**
 * A button that opens a form over the page.
 *
 * It is built on the native <dialog>: shown with showModal(), the browser
 * keeps focus inside it, closes it on Escape, and makes the page behind it
 * inert. The contents stay in the document while it is closed, so a form
 * inside keeps its state between openings.
 */

const CloseContext = createContext<(() => void) | null>(null);

/**
 * Closes the modal this is rendered in. Null outside a modal.
 */
export function useCloseModal() {
  return useContext(CloseContext);
}

export function ModalButton({
  label,
  icon,
  title,
  description,
  children,
  tone = "primary",
}: {
  label: string;
  icon?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  tone?: "primary" | "secondary";
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useCallback(() => dialog.current?.close(), []);

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold tn-press",
          tone === "primary"
            ? "bg-[var(--color-caviar)] text-[var(--color-emptiness)] hover:bg-[var(--color-iron-fixture)]"
            : "border border-[var(--color-spotted-dove)] text-[var(--color-caviar)] hover:bg-[var(--color-night-white)]",
        )}
      >
        {icon}
        {label}
      </button>

      <dialog
        ref={dialog}
        aria-label={title}
        // A click on the dialog itself, rather than on what is inside it,
        // is a click on the backdrop.
        onClick={(event) => {
          if (event.target === dialog.current) close();
        }}
        // tn-modal (globals.css) fades and scales it in and out.
        className="tn-modal m-auto w-[min(36rem,calc(100vw-2rem))] rounded-2xl border border-[var(--color-spotted-dove)] bg-[var(--color-emptiness)] p-0 text-[var(--color-caviar)] shadow-2xl backdrop:bg-[var(--color-caviar)]/40 backdrop:backdrop-blur-[2px]"
      >
        <div className="max-h-[85vh] overflow-y-auto p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight">{title}</h2>
              {description && (
                <p className="mt-1 text-xs leading-relaxed text-[var(--color-iron-fixture)]">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="rounded-lg p-1.5 text-[var(--color-iron-fixture)] transition-colors hover:bg-[var(--color-night-white)]"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
          <CloseContext.Provider value={close}>{children}</CloseContext.Provider>
        </div>
      </dialog>
    </>
  );
}

/**
 * The row of actions at the top of a panel.
 */
export function ActionBar({ children }: { children: ReactNode }) {
  return <div className="mb-6 flex flex-wrap items-center gap-2">{children}</div>;
}
