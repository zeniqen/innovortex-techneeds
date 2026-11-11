"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  IconEye,
  IconEyeOff,
  IconX,
  IconCheck,
  IconAlertCircle,
} from "@tabler/icons-react";

export type LoginRole = "mentee" | "mentor";

const CONFIG = {
  mentee: {
    title: "Mentee Login",
    subtitle: "Enter your credentials to access your dashboard",
    identifierLabel: "Enrollment Number",
    identifierType: "text",
    endpoint: "/api/platform/login",
    role: "mentee",
    panel: "/mentee",
  },
  mentor: {
    title: "Mentor Login",
    subtitle: "Enter your credentials to access mentor dashboard",
    identifierLabel: "Email",
    identifierType: "email",
    endpoint: "/api/platform/login",
    role: "mentor",
    panel: "/mentor",
  },
} as const;

type Status = "idle" | "submitting" | "error" | "success";

/**
 * The TechNeeds sign-in pop-up, shared by the Mentee and Mentor roles.
 *
 * It posts to the same endpoints the original site uses, so the credentials
 * are checked against the real backend rather than a mock.
 */
export function LoginModal({
  role,
  onClose,
}: {
  role: LoginRole | null;
  onClose: () => void;
}) {
  const config = role ? CONFIG[role] : null;

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const reduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const identifierRef = useRef<HTMLInputElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setIdentifier("");
    setPassword("");
    setShowPassword(false);
    setStatus("idle");
    setMessage("");
    onClose();
  }, [onClose]);

  // Move focus into the dialog when it opens, and hand it back on close.
  useEffect(() => {
    if (!role) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const timer = setTimeout(() => identifierRef.current?.focus(), 60);

    return () => {
      clearTimeout(timer);
      restoreFocusRef.current?.focus?.();
    };
  }, [role]);

  // Escape closes, and the page behind the dialog does not scroll.
  useEffect(() => {
    if (!role) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [role, close]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!config || status === "submitting") return;

    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch(config.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: config.role,
          identifier,
          password,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        setStatus("error");
        setMessage(payload?.error ?? "Invalid credentials");
        return;
      }

      setStatus("success");
      // The session is a cookie now, so the panel picks it up on the way
      // in and there is no token to keep.
      window.location.assign(config.panel);
    } catch {
      setStatus("error");
      setMessage("Could not reach the sign-in service. Try again.");
    }
  };

  return (
    <AnimatePresence>
      {config && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="absolute inset-0 h-full w-full cursor-default bg-[var(--color-caviar)]/40 backdrop-blur-sm"
          />

          <motion.div
            ref={cardRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-modal-title"
            initial={{
              opacity: 0,
              scale: reduceMotion ? 1 : 0.96,
              y: reduceMotion ? 0 : 12,
            }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: reduceMotion ? 1 : 0.96,
              y: reduceMotion ? 0 : 12,
            }}
            transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.23, 1, 0.32, 1] }}
            className="bg-techboard-card relative w-full max-w-[400px] rounded-2xl p-8 shadow-xl"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-lg p-1.5 text-[var(--color-iron-fixture)] transition-colors hover:bg-[var(--color-night-white)] hover:text-[var(--color-caviar)]"
            >
              <IconX className="w-4 h-4" />
            </button>

            {status === "success" ? (
              <div className="py-6 text-center space-y-4">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-caviar)] text-[var(--color-emptiness)]">
                  <IconCheck className="w-6 h-6" />
                </span>
                <h2 className="text-xl font-extrabold text-[var(--color-caviar)]">
                  You are signed in
                </h2>
                <p className="text-sm text-[var(--color-iron-fixture)]">
                  Welcome back{identifier ? `, ${identifier}` : ""}. Taking
                  you to your dashboard.
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="mt-2 inline-flex items-center justify-center rounded-xl bg-[var(--color-caviar)] px-5 py-3 text-sm font-bold text-[var(--color-emptiness)] shadow-md transition-colors duration-150 hover:bg-[var(--color-iron-fixture)]"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="text-center space-y-1.5">
                  <h2
                    id="login-modal-title"
                    className="text-2xl font-extrabold tracking-tight text-[var(--color-caviar)]"
                  >
                    {config.title}
                  </h2>
                  <p className="text-sm text-[var(--color-iron-fixture)]">
                    {config.subtitle}
                  </p>
                </div>

                <input
                  ref={identifierRef}
                  type={config.identifierType}
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder={config.identifierLabel}
                  aria-label={config.identifierLabel}
                  autoComplete={
                    role === "mentor" ? "email" : "username"
                  }
                  className="w-full rounded-xl border border-[var(--color-spotted-dove)] bg-[var(--color-caviar)] px-4 py-3 text-sm text-[var(--color-emptiness)] placeholder:text-[var(--color-stone-haze)] transition-colors focus:border-[var(--color-caviar)] focus:outline-none focus:ring-2 focus:ring-[var(--color-caviar)]/20"
                />

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Password"
                    aria-label="Password"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-[var(--color-spotted-dove)] bg-[var(--color-caviar)] py-3 pl-4 pr-11 text-sm text-[var(--color-emptiness)] placeholder:text-[var(--color-stone-haze)] transition-colors focus:border-[var(--color-caviar)] focus:outline-none focus:ring-2 focus:ring-[var(--color-caviar)]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[var(--color-stone-haze)] transition-colors hover:text-[var(--color-emptiness)]"
                  >
                    {showPassword ? (
                      <IconEyeOff className="w-4 h-4" />
                    ) : (
                      <IconEye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {status === "error" && (
                  <p
                    role="alert"
                    className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--color-loss)]"
                  >
                    <IconAlertCircle className="w-4 h-4" />
                    <span>{message}</span>
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--color-caviar)] px-5 py-3 text-sm font-bold text-[var(--color-emptiness)] shadow-md transition-colors duration-150 hover:bg-[var(--color-iron-fixture)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "submitting" ? "Signing in..." : "Login"}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
