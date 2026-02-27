import React, { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../../context";

const Dialog = ({ open, onOpenChange, children }) => {
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onOpenChange]);

  // Focus trapping & body scroll lock
  useEffect(() => {
    if (!open) return;

    // Store the previously focused element to restore later
    previousFocusRef.current = document.activeElement;

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus the first focusable element inside the dialog
    const timer = setTimeout(() => {
      if (dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      }
    }, 50);

    // Trap focus inside the dialog
    const handleTab = (e) => {
      if (e.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleTab);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleTab);
      document.body.style.overflow = originalOverflow;

      // Restore focus to the element that opened the dialog
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus();
      }
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      ref={dialogRef}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
        aria-label="Close dialog"
      />
      <div className={`relative z-50 w-full ${isDark ? "dark" : ""}`}>
        {children}
      </div>
    </div>,
    document.body,
  );
};

const DialogContent = ({ children, className = "" }) => {
  const { isDark } = useTheme();
  return (
    <div
      className={`relative mx-auto rounded-lg shadow-lg border ${
        isDark
          ? "bg-gray-900 border-gray-700 text-gray-100"
          : "bg-white border-gray-200 text-gray-900"
      } ${className}`}
    >
      {children}
    </div>
  );
};

const DialogHeader = ({ children, className = "" }) => {
  return (
    <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
      {children}
    </div>
  );
};

const DialogTitle = ({ children, className = "" }) => {
  return (
    <h3
      id="dialog-title"
      className={`text-lg font-semibold leading-none tracking-tight ${className}`}
    >
      {children}
    </h3>
  );
};

export { Dialog, DialogContent, DialogHeader, DialogTitle };
