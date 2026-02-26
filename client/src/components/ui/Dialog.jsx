import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../../context";

const Dialog = ({ open, onOpenChange, children }) => {
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);

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

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      <div className={`relative z-50 w-full ${isDark ? "dark" : ""}`}>
        {children}
      </div>
    </div>,
    document.body
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
      className={`text-lg font-semibold leading-none tracking-tight ${className}`}
    >
      {children}
    </h3>
  );
};

export { Dialog, DialogContent, DialogHeader, DialogTitle };
