"use client";

import { type RefObject, useEffect } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "details > summary",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

interface DialogFocusOptions {
  initialFocusRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
}

export function useDialogFocus(
  dialogRef: RefObject<HTMLElement | null>,
  { initialFocusRef, onClose }: DialogFocusOptions,
) {
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusInitial = () => {
      const target = initialFocusRef?.current
        ?? dialog.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
        ?? dialog;
      target.focus();
    };

    const animationFrame = window.requestAnimationFrame(focusInitial);
    document.body.classList.add("modal-open");

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true");
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("modal-open");
      previousFocus?.focus();
    };
  }, [dialogRef, initialFocusRef, onClose]);
}
