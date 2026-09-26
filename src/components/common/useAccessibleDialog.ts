/**
 * YOJANA SETU — ACCESSIBLE DIALOG HOOK (Phase 2E.2)
 * --------------------------------------------------
 * Reusable dialog behavior for the hand-built modals:
 *
 * - Focus-in on open: moves focus to `[data-autofocus]`, else the first
 *   focusable element, else the dialog container itself (tabIndex -1).
 * - Focus return: restores focus to the element that opened the dialog.
 * - Escape closes via onClose.
 * - Focus trap: Tab / Shift+Tab cycles inside the dialog.
 * - Marks the dialog with data-accessible-dialog so the global
 *   prefers-reduced-motion rule in index.css can neutralize entrance
 *   animations for motion-sensitive users.
 *
 * The caller still owns the JSX semantics: role="dialog",
 * aria-modal="true", and aria-labelledby/aria-label for the accessible name.
 */

import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), ' +
  'input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface AccessibleDialogOptions {
  isOpen: boolean;
  onClose: () => void;
  /** Keep Tab focus cycling inside the dialog. Default true. */
  trapFocus?: boolean;
  /** Restore focus to the opener on close. Default true. */
  returnFocus?: boolean;
}

export function useAccessibleDialog({
  isOpen,
  onClose,
  trapFocus = true,
  returnFocus = true,
}: AccessibleDialogOptions): { dialogRef: React.RefObject<HTMLDivElement | null> } {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const el = dialogRef.current;
    let raf = 0;
    if (el) {
      el.dataset.accessibleDialog = 'true';
      // Focus-in after paint so portals / AnimatePresence have mounted.
      raf = requestAnimationFrame(() => {
        const host = dialogRef.current;
        if (!host) return;
        const target =
          host.querySelector<HTMLElement>('[data-autofocus]') ??
          host.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ??
          host;
        target.focus({ preventScroll: true });
      });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !trapFocus) return;
      const host = dialogRef.current;
      if (!host) return;
      const focusables = Array.from(host.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (node) => node.offsetParent !== null || node === document.activeElement,
      );
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !host.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    // Capture phase so the trap runs before inner handlers stop propagation.
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', handleKeyDown, true);
      if (returnFocus) {
        const prev = previouslyFocusedRef.current;
        if (prev && prev.isConnected) {
          prev.focus({ preventScroll: true });
        }
      }
    };
  }, [isOpen, trapFocus, returnFocus]);

  return { dialogRef };
}
