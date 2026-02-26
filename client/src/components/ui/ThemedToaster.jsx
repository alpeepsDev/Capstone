import React from "react";
import { Toaster } from "react-hot-toast";
import { useTheme } from "../../context/useTheme";

export const ThemedToaster = () => {
  const { isDark } = useTheme();
  console.log("ThemedToaster isDark:", isDark);

  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: isDark ? "#363636" : "#fff",
          color: isDark ? "#fff" : "#363636",
          borderRadius: "8px",
          border: isDark ? "1px solid #4a4a4a" : "1px solid #e5e7eb",
        },
        success: {
          duration: 3000,
          theme: {
            primary: "green",
            secondary: "black",
          },
          iconTheme: {
            primary: "#10B981",
            secondary: isDark ? "#fff" : "#f0fdf4",
          },
        },
        error: {
          iconTheme: {
            primary: "#EF4444",
            secondary: isDark ? "#fff" : "#fef2f2",
          },
        },
      }}
    />
  );
};
