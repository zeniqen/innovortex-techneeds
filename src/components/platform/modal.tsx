"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
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

const HoldContext = createContext<((change: 1 | -1) => void) | null>(null);

/**
 * Keeps the modal this is rendered in open while `held` is true: Escape,
 * a click on the backdrop and the close button all stop working. For
 * something the person must not lose by accident, like a password that is
 * shown once. Whatever holds the modal should also carry
 * `data-hold-modal`, which the modal checks before closing.
 */
export function useHoldModal(held: boolean) {
  const hold = useContext(HoldContext);
  useEffect(() => {
    if (!hold || !held) return;
    hold(1);
    return () => hold(-1);
  }, [hold, held]);
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
  const [holds, setHolds] = useState(0);
  const held = holds > 0;
  const hold = useCallback(
    (change: 1 | -1) => setHolds((count) => Math.max(0, count + change)),
    [],
  );

  // Asked of the DOM as well as of the count, so a close in the same tick
  // as the hold being taken still sees it.
  const isHeld = useCallback(
    () => held || Boolean(dialog.current?.querySelector("[data-hold-modal]")),
    [held],
  );

  const close = useCallback(() => {
    if (isHeld()) return;
    dialog.current?.close();
  }, [isHeld]);

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
        // Escape fires cancel first; while something holds the modal, it
        // is refused.
        onCancel={(event) => {
          if (isHeld()) event.preventDefault();
        }}
        // Browsers let a second Escape through without a cancellable
        // cancel event, so if the dialog closes while held, put it back.
        onClose={() => {
          if (isHeld() && dialog.current && !dialog.current.open) {
            dialog.current.showModal();
          }
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
              disabled={held}
              aria-label="Close"
              title={held ? "Confirm you have saved the details first" : undefined}
              className="rounded-lg p-1.5 text-[var(--color-iron-fixture)] transition-colors hover:bg-[var(--color-night-white)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
          <HoldContext.Provider value={hold}>
            <CloseContext.Provider value={close}>{children}</CloseContext.Provider>
          </HoldContext.Provider>
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
